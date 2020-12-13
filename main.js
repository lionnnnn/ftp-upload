/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 16:46:52
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-12 17:43:35
 */

const MyFtp = require('./ftp/index.js');

async function main() {
    let client = new MyFtp.Client();
    await MyFtp.login(client);
    await MyFtp.upload(client, './upload_files', '/yjc/');
    console.log(await MyFtp.list(client, '/yjc/'));
    MyFtp.close(client);
};

main();