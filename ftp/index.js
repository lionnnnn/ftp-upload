/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 11:13:26
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-12 18:12:53
 */
const Client = require('ftp');
const fs = require('fs');
const glob = require('glob');
const merge = require('lodash/merge');
const logger = require('../log/index.js');

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

// ip port username password
function login(client, options = {}) {
    return new Promise((resolve, reject) => {
        options = merge({}, options.sftp ? DEFAULT_SFTP_OPTIONS : DEFAULT_FTP_OPTIONS, options);
        logger.loginInfo(options);

        client.on('ready', () => {
            logger.debug('server is ready.');
            resolve(options);
        });

        client.on('error', (error) => {
            logger.error(error);
            reject(error);
        });

        client.connect(options);
    });
};

function close(client) {
    logger.debug('close connection.');
    client.end();
};

// 判断path是否是 目录
function isDir(path) {
    let stat = fs.statSync(path);

    logger.debug(path + "是一个文件" + stat.isFile());
    logger.debug(path + "是一个文件夹" + stat.isDirectory());
    return stat.isDirectory();
};

// 根据路径 拿到所有的 file
async function getFilePathFromPath(path) {
    let fileList = [];

    // glob解析 TODO: 目录嵌套目录需要递归
    let filePaths = glob.sync(path, {});
    for (let filePath of filePaths) {
        let flag = await isDir(filePath);

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

    logger.info('getFilePathFromPath', 'fileList', fileList);

    return fileList;
};


function list(client, destPath) {
    return new Promise((resolve, reject) => {
        client.list([destPath], function(err, list) {
            if (err) {
                logger.error(err);
                reject(err);
            }
            logger.logList(list);
            resolve(list);
        });
    });
};

// path/glob name
function upload(client, path, destPath, isSerial) {

    return new Promise(async(resolve, reject) => {
        let fileList = await getFilePathFromPath(path);

        // TODO: 其中一个文件报错应该要继续
        if (isSerial) {
            await serialUpload(client, fileList, destPath);
        } else {
            await parallelUpload(client, fileList, destPath);
        }
    });
};

// 串行上传
async function serialUpload(client, fileList, destPath) {
    for (let file of fileList) {
        await uploadOneFile(client, file, destPath);
    }
}

// 并行上传
function parallelUpload(client, fileList, destPath) {
    // return new Promise.all((resolve, reject) => {
    //     fileList.forEach(file => {
    //         uploadOneFile(client, file, destPath);
    //     });
    // });

    return Promise.all(
        fileList.map(file => uploadOneFile(client, file, destPath))
    );
}

function uploadOneFile(client, file, destPath) {
    return new Promise((resolve, reject) => {
        logger.info('start-upload', 'file', file);
        client.put(file, destPath + file, function(err) {
            if (err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info('end-upload', 'file', file);
                resolve(file);
            }
        });
    });
}

module.exports = {
    login,
    upload,
    close,
    list,
    Client
};