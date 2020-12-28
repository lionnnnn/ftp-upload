/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 16:46:52
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 17:30:33
 */

const uploader = require('./src/uploader/index.js');

async function main() {
    await uploader.connect({
        host: '47.107.157.97',
        port: 22,
        user: 'sftp',
        password: 'Admin@123',
        sftp: false
    });
    await uploader.upload('./upload_files', '/yjc/');
    await uploader.list('/yjc/');
    await uploader.close();
};

main();