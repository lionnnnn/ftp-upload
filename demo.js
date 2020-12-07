/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 16:46:52
 * @LastEditors: lion
 * @LastEditTime: 2020-12-06 16:49:17
 */

const MyFtp = require('./index');

async function main() {
    let client = new MyFtp.Client();
    await MyFtp.login(client)
    await MyFtp.upload(client, './test', '/yjc/');
    console.log(await MyFtp.list(client, '/yjc/'));
    MyFtp.close(client);
};

main();
