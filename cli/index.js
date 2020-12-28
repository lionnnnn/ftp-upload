#!/usr/bin/env node

const program = require('commander');
const uploader = require('../src/uploader/index.js');

let loginOptions = {};

program
    .version('文件上传 1.0.0')

program
    .command('login')
    .description('连接服务器')
    .option('-h, --host [host]', 'host地址',)
    .option('-p, --port [port]', '端口号', 21)
    .option('-u, --user [user]', '用户名')
    .option('-P, --password [password]', '密码')
    .option('-s, --sftp', '是否为sftp')
    .action(async(options) => {
        loginOptions = {
            host: options.host,
            port: options.port,
            user: options.user,
            password: options.password,
            sftp: !!options.sftp
        };

        await uploader.connect(loginOptions);
        await uploader.close();
    });

program
    .command('upload')
    .description('上传文件')
    .requiredOption('-p, --path [path]', '上传文件路径')
    .requiredOption('-d, --destPath [destPath]', '服务器路径', '/')
    .action(async(options) => {
        await uploader.connect(loginOptions);
        await uploader.upload(options.path, options.destPath);
        await uploader.list(options.destPath);
        await uploader.close();
    });


program
    .command('list')
    .description('查看文件列表')
    .option('-d, --destPath [destPath]', '服务器路径', '/')
    .action(async(options) => {
        await uploader.connect(loginOptions);
        await uploader.list(options.destPath);
        await uploader.close();

    });

program
    .command('close')
    .description('关闭服务器的连接')
    .action(async() => {
        await uploader.connect(loginOptions);
        await uploader.close();
    });

program.parse(process.argv);