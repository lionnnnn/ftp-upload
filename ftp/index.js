/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 11:13:26
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-26 14:01:06
 */
const ftp = require('ftp');
const file = require('../file_opr/index.js');
const merge = require('lodash/merge');
const logger = require('../log/index.js');
const validate = require('../validate/index.js');
const retryNum = 3;

// ftp 默认登录信息
const DEFAULT_FTP_OPTIONS = {
    host: '47.107.157.97',
    port: 21,
    user: 'ftp',
    password: 'Admin@123'
};


let failFileList = [];

// ip port username password
function login(client, options = {}) {
    logger.debug('login fn start...');
    options = merge({}, DEFAULT_FTP_OPTIONS, options);

    // options = merge({}, options.sftp ? DEFAULT_SFTP_OPTIONS : DEFAULT_FTP_OPTIONS, options);
    logger.loginInfo(options);

    if (!validate.validateLoginOptions(options)) {
        logger.error()
        return Promise.reject('login failed, please correct and retry');
    };

    return new Promise((resolve, reject) => {

        client.on('ready', () => {
            logger.debug('server is ready.');
            resolve(options);
        });

        client.on('error', (error) => {
            logger.error(error);
            reject(error);
            return;
        });

        client.connect(options);
    });
};

function close(client) {
    client.end();
    logger.debug('close connection.');
};


function list(client, destPath) {
    logger.debug('list fn start...');
    logger.info('list', 'destPath', destPath);
    if (!validate.validateEmpty(destPath)) {
        return Promise.reject('[list]: destination path can not be empty');
    }

    return new Promise((resolve, reject) => {
        client.list([destPath], function(err, list) {
            if (err) {
                logger.info('list', 'err', err);

                // 找不到文件
                if (err.code === 550) {
                    reject('list error: The system cannot find the files specified.');
                }
                reject(err);
                return;
            }

            // 打印文件列表
            logger.logList(list);
            resolve(list);
        });
    });
};

// path/glob name
function upload(client, path, destPath, isSerial) {
    logger.debug('start upload fn');
    failFileList = [];
    return new Promise(async(resolve, reject) => {
        let fileList;

        // 获取文件列表
        try {
            fileList = await file.getFilePathFromPath(path);
            if (!fileList.length) {
                logger.error('upload fn can not find files to upload');
                reject();
                return;
            }
        } catch (err) {
            logger.error('getFileFromPath is error!', err);
            reject(err);
            return;
        }

        // 通过list可以判断远程是否有目标文件夹
        list(client, destPath).then(async() => {
            try {

                await _parallelUpload(client, fileList, destPath);

                // if (isSerial) {
                //     await _serialUpload(client, fileList, destPath);
                // } else {
                //     await _parallelUpload(client, fileList, destPath);
                // }
                logger.info('upload-success', 'fileList', fileList);
                resolve(fileList);
                getFailFileList();

            } catch (err) {
                logger.error('upload-fn error', err);
                reject(err);
            }
        }).catch((err) => {
            reject(err);
        });

    });
};



// 并行上传 FTP
function _parallelUpload(client, fileList, destPath) {
    logger.info('_parallelUpload', 'fileList', fileList);
    logger.info('_parallelUpload', 'destPath', destPath);

    return Promise.all(
        fileList.map(file => _uploadOneFile(client, file, destPath))
    ).then(resList => {

        resList.forEach(async(item) => {
            if (item.success) {
                return;
            }

            await _reUpload(client, destPath, item);

        });
        logger.info('_parallelUpload', 'failFileList', getFailFileList());

    });
}

async function _reUpload(client, destPath, resItem) {
    // 失败重连3次
    logger.debug('start to retry upload file: ', resItem.file);
    logger.info('_reUpload', 'file', resItem.file);

    let retry = retryNum;

    while (retry > 0) {
        let res = await _uploadOneFile(client, resItem.file, destPath);
        if (res.success) {
            logger.debug(`retry upload ${resItem.file} success`);
            break;
        }

        retry--;
        logger.error(`retry upload ${resItem.file} failed, still will retry ${retry} times`);

        retry === 0 && !res.success && _pushFailFileList(resItem.file);
    }
}

function getFailFileList() {
    let currentFailList = failFileList || [];
    logger.info('getFailFileList', 'failFileList number:', currentFailList.length || 0);
    logger.info('getFailFileList', 'failFileList', currentFailList);
    return currentFailList;
}

function _pushFailFileList(file) {
    failFileList.push(file);

    logger.info('_pushFailFileList', 'failFileList number:', failFileList.length || 0);
    logger.info('_pushFailFileList', 'failFileList', failFileList);
}

// 防止出错终止所有的上传所以只有resolve状态
function _uploadOneFile(client, file, destPath) {
    return new Promise((resolve, reject) => {
        logger.info('_uploadOneFile start-upload', 'file', file);
        client.put(file, destPath + file, function(err) {
            if (err) {
                logger.error('_uploadOneFile end-upload error: ', file, 'upload failed');
                resolve({
                    success: false,
                    error: err,
                    file: file
                });
            } else {
                logger.info('_uploadOneFile end-upload success', 'file', file);
                resolve({
                    success: true,
                    file: file
                });
            }
        });
    });
}

module.exports = {
    login,
    upload,
    close,
    list,
    getFailFileList,
    ftp
};