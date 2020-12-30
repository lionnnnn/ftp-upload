const log4js = require("log4js");
const logger = log4js.getLogger('lion');
const address = require('address');
const chalk = require('chalk');

let localIp = address.ip();

logger.level = 'debug';
log4js.configure({
    appenders: { lion: { type: "file", filename: "log/ftp.log" } },
    categories: { default: { appenders: ["lion"], level: "debug" } }
});

let prefix = '';

function setPrefix (type, name) { 
    prefix = `【${type}】 === 【${localIp}】 === `;
    name && (prefix = `${prefix} 【${name}】 === `);
}   

function error(fnName, errorMsg = '') {
    let msg = `[${fnName}] === ` + errorMsg;
    console.log(chalk.red(msg));
    logger.error(prefix + msg);
};

function debug(fnName, name, value) {
    let msg = `[${fnName}]: ${name} => ${JSON.stringify(value)}`;
    console.log(msg);
    logger.debug(prefix + msg);
};

function info(info) {
    console.log(chalk.yellow(info));
    logger.info(prefix + info);
};

function logList(list) {
    if (!list || !list.length) {
        info('there is no file in server');
        return;
    }
    for (let fileInfo of list) {
        debug('list', 'fileInfo', fileInfo);
    }
}

function destroy () {
    prefix = null;
}

module.exports = {
    setPrefix,
    error,
    info,
    debug,
    destroy,
    logList
};