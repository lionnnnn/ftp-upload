/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 11:13:26
 * @LastEditors: lion
 * @LastEditTime: 2020-12-19 17:18:06
 */
const Client = require('ftp');
const fs = require('fs');
const glob = require('glob');
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

// sftp 默认登录信息
const DEFAULT_SFTP_OPTIONS = {
    host: '47.107.157.97',
    port: 22,
    user: 'sftp',
    password: 'Admin@123'
};

let failFileList = [];

// ip port username password
function login(client, options = {}) {
    logger.debug('login fn start...');
    options = merge({}, options.sftp ? DEFAULT_SFTP_OPTIONS : DEFAULT_FTP_OPTIONS, options);
    logger.loginInfo(options);

    if (!validate.validateLoginOptions(options)) {
        return Promise.reject('login failed, pleas correct and retry');
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

// 判断path是否是 目录
function _isDir(path) {
    let stat = fs.statSync(path);

    logger.debug(path + "is a file" + stat.isFile());
    logger.debug(path + "is a dir" + stat.isDirectory());
    return stat.isDirectory();
};

// 根据路径 拿到所有的 file
async function _getFilePathFromPath(path) {
    logger.debug('start getfileFromPath..');
    let fileList = [];

    // glob解析 TODO: 目录嵌套目录需要递归
    let filePaths = glob.sync(path, {});
    logger.info('_getFilePathFromPath', 'filePaths', filePaths);

    if (!filePaths.length) {
        logger.error('[_getFilePathFromPath]: can not find any files to upload');
        return [];
    }

    for (let filePath of filePaths) {
        let flag = await _isDir(filePath);

        // 如果 是 文件目录 需要取出文件
        if (flag) {
            let files = fs.readdirSync(path);

            files.forEach(file => {
                fileList.push(file);
            });
        } else {
            fileList.push(filePath);
        }
    }

    logger.info('_getFilePathFromPath', 'fileList', fileList);

    return fileList;
};


function list(client, destPath) {
    logger.debug('start list fn');
    logger.info('list', 'destPath', destPath);
    if (!validate.validateEmpty(destPath)) {
        return Promise.reject('[list]: destination path can not be empty');
    }

    return new Promise((resolve, reject) => {
        client.list([destPath], function(err, list) {
            logger.info('list', 'err', err);
            logger.info('list', 'list', list);
            if (err) {
                if (err.code === 550) {
                    reject('list error: The system cannot find the file specified.');
                }
                reject(err);
            } else {

                // 打印文件列表
                logger.logList(list);
                resolve(list);
            }

        });
    });
};

// path/glob name
function upload(client, path, destPath, isSerial) {
    logger.debug('start upload fn');

    return new Promise(async(resolve, reject) => {
        let fileList;
        try {
            fileList = await _getFilePathFromPath(path);
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

                if (isSerial) {
                    await _serialUpload(client, fileList, destPath);
                } else {
                    await _parallelUpload(client, fileList, destPath);
                }
                logger.info('upload-success', 'fileList', fileList);
                resolve(fileList);

            } catch (err) {
                logger.error('upload-fn error', err);
                reject(err);
            }
        }).catch((err) => {
            reject(err);
        })
    });
};

// 串行上传 sftp
async function _serialUpload(client, fileList, destPath) {
    for (let file of fileList) {

        let res = await _uploadOneFile(client, file, destPath);
        if (res.success) {
            continue;
        }

        await _reUpload(client, destPath, res);
    }
    logger.debug(`upload File failed number: ${failFileList.length}`);
    logger.info('_serialUpload', 'failFileList', failFileList)

}

// 并行上传
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
        logger.debug(`upload File failed number: ${failFileList.length}`);
        logger.info('_parallelUpload', 'failFileList', failFileList)

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

        retry === 0 && !res.success && failFileList.push(resItem.file);
    }
}

function getFailFileList() {
    return failFileList;
}

// 防止出错终止所有的上传所以只有resolve状态
function _uploadOneFile(client, file, destPath) {
    return new Promise((resolve, reject) => {
        logger.info('start-upload', 'file', file);
        client.put(file, destPath + file, function(err) {
            if (err) {
                logger.error('end-upload error: ', file, 'upload failed');
                resolve({
                    success: false,
                    error: err,
                    file: file
                });
            } else {
                logger.info('end-upload success', 'file', file);
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
    Client
};