/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 11:13:26
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 17:44:31
 */
const Client = require('ftp');
const logger = require('../util/log/index.js');

let client = null;

logger.setPrefix('FTP');

function initClient () {
    client = new Client();
}

// ip port username password
function login(options) {
    return new Promise((resolve, reject) => {
        client.on('ready', () => {
            logger.info('server is ready.');
            resolve(options);
        });

        client.on('error', (error) => {
            logger.error('login', error);
            reject(error);
            return;
        });

        client.connect(options);
    });
};

function close() {
    client.end();
    logger.info('close connection.');
};


function list(destPath) {
    return new Promise((resolve, reject) => {

        client.list([destPath], function(err, list) {
            if (err) {
                logger.debug('list', 'err', err);

                // 找不到文件
                if (err.code === 550) {
                    reject('[list error]: The system cannot find the files specified.');
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



// 防止出错终止所有的上传所以只有resolve状态
function uploadOneFile(file, destPath) {
    return new Promise((resolve, reject) => {
        logger.debug('uploadOneFile start-upload', 'file', file);
        client.put(file, destPath + file, function(err) {
            if (err) {
                logger.error('uploadOneFile end-upload error: ', file, 'upload failed');
                resolve({
                    success: false,
                    error: err,
                    file: file
                });
            } else {
                logger.debug('uploadOneFile end-upload success', 'file', file);
                resolve({
                    success: true,
                    file: file
                });
            }
        });
    });
}

function destroy () {
    client = null;
    logger.destroy();
}

module.exports = {
    initClient,
    login,
    close,
    list,
    uploadOneFile,
    destroy
};