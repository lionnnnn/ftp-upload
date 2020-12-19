#!/usr/bin/env node

const program = require('commander')
const MyFtp = require('../ftp/index');
const logger = require('../log/index.js');

let client = new MyFtp.Client();
let isSftp = false;
let loginOptions = {};
program
    .version('文件上传 1.0.0')

program
    .command('login')
    .description('连接服务器')
    .option('-h, --host [host]', 'host地址', '47.107.157.97')
    .option('-p, --port [port]', '端口号')
    .option('-u, --user [user]', '用户名')
    .option('-P, --password [password]', '密码', 'Admin@123')
    .option('-s, --sftp', '是否为sftp')
    .action(async(options) => {
        loginOptions = {
            host: options.host,
            port: options.port,
            user: options.user,
            password: options.password,
            sftp: options.sftp
        };
        try {
            await MyFtp.login(client, loginOptions);
        } catch (err) {
            logger.error(err);
        }
        await MyFtp.close(client);

    });

program
    .command('upload')
    .description('上传文件')
    .requiredOption('-p, --path [path]', '上传文件路径', './upload_files/')
    .requiredOption('-d, --destPath [destPath]', '服务器路径', '/yjc/')
    .action(async(options) => {
        try {
            await MyFtp.login(client, loginOptions);
            await MyFtp.upload(client, options.path, options.destPath, isSftp);
            await MyFtp.list(client, options.destPath);
        } catch (err) {
            logger.error(err);
        }
        await MyFtp.close(client);

    });


program
    .command('list')
    .description('查看文件列表')
    .option('-d, --destPath [destPath]', '服务器路径', '/')
    .action(async(options) => {
        try {
            await MyFtp.login(client, loginOptions);
            await MyFtp.list(client, options.destPath);
        } catch (err) {
            logger.error(err);
        }
        await MyFtp.close(client);

    });

program
    .command('close')
    .description('关闭服务器的连接')
    .action(async() => {
        try {
            await MyFtp.login(client, loginOptions);
        } catch (err) {
            logger.error(err);
        }
        await MyFtp.close(client);


    });

program.parse(process.argv);