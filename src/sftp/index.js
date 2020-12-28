/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-25 18:32:44
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 09:54:41
 */

const Client = require('ssh2-sftp-client');
const logger = require('../util/log/index.js');

let client = null;

logger.setPrefix('SFTP');

function initClient () {
    client = new Client();
}


function login(options) {
    return client.connect(options).then(() => {
        logger.info('server is ready.');
    }).catch((error) => {
        logger.error(error);
    });
};

function close() {
    client.end();
    logger.info('close connection.');
};

function list(destPath) {
    return client.list(destPath).then((list) => {
        
        // 打印文件列表
        logger.logList(list);
    }).catch((error) => {
        logger.debug('list', 'err', error);
        logger.error('list', 'failed to load remote file list');
    })
}


// 防止出错终止所有的上传所以只有resolve状态
function uploadOneFile(file, destPath) {

    return new Promise(async(resolve) => {
        await client.fastPut(file, destPath + file).then(() => {
            logger.debug('uploadOneFile end-upload success', 'file', file);
            resolve({
                success: true,
                file: file
            });
        }).catch((err) => {
            logger.error('uploadOneFile end-upload error: ', file, 'upload failed');
            resolve({
                success: false,
                error: err,
                file: file
            });
        })
    })
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
}