/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-25 19:43:35
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 09:42:05
 */

const fs = require('fs');
const glob = require('glob');
const logger = require('../log/index.js');

// 判断path是否是 目录
function isDir(path) {
    let stat = fs.statSync(path);
    logger.debug('isDir', 'isDirectory', stat.isDirectory());
    return stat.isDirectory();
};

// 根据路径(目录或者是文件名) 拿到所有的 file
async function getFilePathFromPath(path) {

    return new Promise(async (resolve, reject) => {
        try {
            logger.info('start getfileFromPath fn..');
            
            let fileList = [];
        
            // glob解析 TODO: 目录嵌套目录需要递归
            let filePaths = glob.sync(path, {});
            
            logger.debug('getFilePathFromPath', 'filePaths', filePaths);
        
            if (!filePaths.length) {
                logger.error('getFilePathFromPath', 'can not find any files from the path!');
                resolve([]);
            }
        
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
        
            logger.debug('getFilePathFromPath', 'fileList', fileList);
            resolve(fileList);
        } catch (err) {
            logger.error('getFilePathFromPath', err);
            reject();
        }
    })
};



module.exports = {
    isDir,
    getFilePathFromPath
};