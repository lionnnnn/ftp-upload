#!/usr/bin/env node
const program = require('commander')
const inquirer = require('inquirer')
const chalk = require('chalk')
const MyFtp = require('./index');

let client = new MyFtp.Client();
program
  .version('文件上传 1.0.0')

program
    .command('login')
    .description('连接ftp服务器')
    .requiredOption('-h, --host [host]', 'host地址', '47.107.157.97')
    .requiredOption('-p, --port [port]', '端口号', 21)
    .requiredOption('-u, --username [username]', '用户名', 'ftp')
    .requiredOption('-P, --password [password]', '密码', 'Admin@123')
    .action(async (options) => {
        await MyFtp.login(client, {
            host: options.host,
            port: options.port,
            username: options.username,
            password: options.password
        });
    });
    
program
    .command('upload')
    .description('上传文件')
    .requiredOption('-p, --path [path]', '上传文件路径', './test/')
    .requiredOption('-d, --destPath [destPath]', '服务器路径', '/yjc/')
    .action(async (options) => {
        await MyFtp.upload(client, options.path, options.destPath);
    });


program
    .command('list')
    .description('查看文件列表')
    .requiredOption('-d, --destPath [destPath]', '服务器路径', '/yjc/')
    .action(async (options) => {
        await MyFtp.list(client, options.destPath);
    });

program
    .command('close')
    .description('关闭服务器的连接')
    .action(async () => {
        await MyFtp.end();
    });
    
program.parse(process.argv);

 