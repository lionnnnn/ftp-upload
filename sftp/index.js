/*
 * @Description: Description
 * @Author: jacksonyyy
 * @Date: 2020-12-25 18:32:44
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-26 09:54:41
 */

const sftp = require('ssh2-sftp-client');
const file = require('../file_opr/index.js');
const merge = require('lodash/merge');
const logger = require('../log/index.js');
const validate = require('../validate/index.js');
const { reject } = require('lodash');

// sftp 默认登录信息
const DEFAULT_SFTP_OPTIONS = {
    host: '47.107.157.97',
    port: 22,
    user: 'sftp',
    password: 'Admin@123'
};

function login(client, options = {}) {
    logger.debug('login fn start...');
    options = merge({}, DEFAULT_SFTP_OPTIONS, options);


    // options = merge({}, options.sftp ? DEFAULT_SFTP_OPTIONS : DEFAULT_FTP_OPTIONS, options);
    logger.loginInfo(options);

    if (!validate.validateLoginOptions(options)) {
        return Promise.reject('login failed, pleas correct and retry');
    };

    return client.connect(options).then(() => {
        logger.debug('server is ready.');
    }).catch((error) => {

        logger.error(error);
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

    return client.list(destPath).then((res) => {
        // 打印文件列表
        logger.logList(list);
    }).catch((error) => {
        logger.info('list', 'err', err);
        logger.error('[list] failed to load remote file list');
    })
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

// 串行上传 sftp
async function _serialUpload(client, fileList, destPath) {
    logger.info('_serialUpload', 'fileList', fileList);
    logger.info('_serialUpload', 'destPath', destPath);

    for (let file of fileList) {

        let res = await _uploadOneFile(client, file, destPath);
        if (res.success) {
            continue;
        }

        await _reUpload(client, destPath, res);
    }
    logger.info('_serialUpload', 'failFileList', getFailFileList());

}

// 防止出错终止所有的上传所以只有resolve状态
function _uploadOneFile(client, file, destPath) {

    return new Promise(async(resolve, reject) => {
        await client.fastPut(file, destPath + file).then((res) => {
            logger.info('_uploadOneFile end-upload success', 'file', file);
            resolve({
                success: true,
                file: file
            });
        }).catch((err) => {
            logger.error('_uploadOneFile end-upload error: ', file, 'upload failed');
            resolve({
                success: false,
                error: err,
                file: file
            });
        })
    })
}


// path/glob name
function upload(client, path, destPath, isSerial) {
    logger.debug('start upload fn');

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

        client.exists(destPath).then(async(res) => {
            if (!res) {
                reject('[upload] remote directory not exist')
            }
            try {

                await _serialUpload(client, fileList, destPath);

                // if (isSerial) {
                //     await _serialUpload(client, fileList, destPath);
                // } else {
                //     await _parallelUpload(client, fileList, destPath);
                // }
                logger.info('upload-success', 'fileList', fileList);
                resolve(fileList);

            } catch (err) {
                logger.error('upload-fn error', err);
                reject(err);
            }
        }).catch((err) => {
            logger.error(err);
        })

    });
};

module.exports = {
    login,
    sftp,
    close,
    upload,
    list,
    getFailFileList
}