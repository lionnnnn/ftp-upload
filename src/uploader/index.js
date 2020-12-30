/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-25 18:32:44
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 09:54:41
 */

const MyFtp = require('../ftp/index.js');
const MySftp = require('../sftp/index.js');
const Logger = require('../util/log/index.js');
const Validate = require('../util/validate/index.js');
const File = require('../util/file_opr/index.js');

let uploader = null;
let loginOptions = [];
let failFileList = [];
const RETRY_NUM = 3;

function _init (options) {

    Logger.debug('[uploader] - [_init]', 'options', options);
    if (!Validate.validateLoginOptions(options)) {
        return false;
    }
    
    loginOptions = options;
    uploader = options.sftp ? MySftp : MyFtp;
    options.sftp ? new MySftp.initClient() : new MyFtp.initClient() ;
    Logger.setPrefix('uploader', options.user);
    return true;
}

function connect (options) {
    if (!_init(options)) {
        return Promise.reject();
    }
    
    Logger.info('connect is starting...')

    return uploader.login(loginOptions);
}

function list (destPath) {
    Logger.info('list is starting...')
    Logger.debug('list', 'destPath', destPath);

    if (!Validate.validateEmpty(destPath)) {
        Logger.error('list', 'destination path can not be empty');
        return Promise.reject('[list error]: destination path can not be empty');
    }

    return uploader.list(destPath);
}

async function _reUpload(destPath, resItem) {
    
    // 失败重连3次
    Logger.info('start to retry upload file: ', resItem.file);
    Logger.debug('_reUpload', 'file', resItem.file);

    let retryNum = RETRY_NUM;

    while (retryNum > 0) {
        let res = await uploader.uploadOneFile(resItem.file, destPath);
        if (res.success) {
            Logger.info(`retryNum upload ${resItem.file} success`);
            break;
        }

        retryNum--;
        Logger.error('_reUpload', `retryNum upload ${resItem.file} failed, still will retryNum ${retryNum} times`);

        retryNum === 0 && !res.success && _pushFailFileList(resItem.file);
    }
}

// 多文件上传
function upload(path, destPath, isSerial = false) {
    failFileList = [];

    Logger.info('start upload fn');

    if (!Validate.validateEmpty(path)) {
        return Promise.reject('[upload] path can not be empty!');
    }

    if (!Validate.validateEmpty(destPath)) {
        return Promise.reject('[upload] destination path can not be empty!');
    }

    return new Promise(async(resolve, reject) => {
        let fileList;

        // 获取文件列表
        fileList = await File.getFilePathFromPath(path);
        if (!fileList || !fileList.length) {
            Logger.error('upload', 'upload fn can not find files to upload');
            reject('[upload error]: can not find files to upload');
            return;
        }

        // sftp 串行上传 ftp 并行上传
        if (isSerial) {
            await _serialUpload(fileList, destPath);
        } else {    
            await _parallelUpload(fileList, destPath);
        }   
        Logger.debug('upload-success', 'fileList', fileList);
        resolve(fileList);
        getFailFileList();
    });
};



// 并行上传 FTP
function _parallelUpload(fileList, destPath) {
    Logger.debug('_parallelUpload', 'fileList', fileList);
    Logger.debug('_parallelUpload', 'destPath', destPath);

    return Promise.all(
        fileList.map(file => uploader.uploadOneFile(file, destPath))
    ).then(resList => {

        resList.forEach(async(item) => {
            if (item.success) {
                return;
            }

            await _reUpload(destPath, item);

        });
        Logger.debug('_parallelUpload', 'failFileList', getFailFileList());

    });
}

// 串行上传 sftp
async function _serialUpload(fileList, destPath) {
    Logger.debug('_serialUpload', 'fileList', fileList);
    Logger.debug('_serialUpload', 'destPath', destPath);

    for (let file of fileList) {

        let res = await uploader.uploadOneFile(file, destPath);
        if (res.success) {
            continue;
        }

        await _reUpload(destPath, res);
    }
    Logger.debug('_serialUpload', 'failFileList', getFailFileList());

}


function getFailFileList() {
    let currentFailList = failFileList || [];
    Logger.debug('getFailFileList', 'failFileList number:', currentFailList.length || 0);
    Logger.debug('getFailFileList', 'failFileList', currentFailList);
    return currentFailList;
}

function _pushFailFileList(file) {
    failFileList.push(file);

    Logger.debug('_pushFailFileList', 'failFileList number:', failFileList.length || 0);
    Logger.debug('_pushFailFileList', 'failFileList', failFileList);
}

function close () {
    uploader.close();
    _destroy();
}

function _destroy () {
    uploader.destroy();
    Logger.destroy();
    uploader = null;
    loginOptions = null;
    failFileList = null;
}

module.exports = {
    connect,
    list,
    upload,
    getFailFileList,
    close
}