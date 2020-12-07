/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-06 11:13:26
 * @LastEditors: lion
 * @LastEditTime: 2020-12-06 16:53:25
 */
const Client = require('ftp');
const fs = require('fs');
const glob = require('glob');
const merge = require('lodash/merge');

const DEFAULT_LOGIN_OPTIONS = {
    host: '47.107.157.97',
    port: 21,
    user: 'ftp',
    password: 'Admin@123'
};

// ip port username password
function login(client, options = {}) {
    client.on('ready', () => {
        console.log('ready...');
    })

    client.connect(merge({}, DEFAULT_LOGIN_OPTIONS, options));
}

function close(client) {
    console.log('close...');
    client.end();
}

// 判断path是否是 目录
function isDir(path) {
    let stat = fs.statSync(path);

    console.info(path + "是一个文件" + stat.isFile());
    console.info(path + "是一个文件夹" + stat.isDirectory());
    return stat.isDirectory();
}

// 根据路径 拿到所有的 file
async function getFilePathFromPath(path) {
    let fileList = [];

    // glob解析
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

    return fileList;
}


function list(client, destPath) {
    return new Promise((resolve, reject) => {
        client.list([destPath], function(err, list) {
            if (err) reject(err);
            resolve(list);
        });
    })

}

// path/glob name
function upload(client, path, destPath) {

    return new Promise(async(resolve, reject) => {
        let fileList = await getFilePathFromPath(path);

        fileList.forEach(file => {
            client.put(file, destPath + file, function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(file, '上传成功！');
                    resolve(file);
                }
            });
        });
    })
}

module.exports = {
    login,
    upload,
    close,
    list,
    Client
};

