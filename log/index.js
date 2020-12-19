let log4js = require("log4js");
let logger = log4js.getLogger();
logger.level = 'debug';
log4js.configure({
    appenders: { lion: { type: "file", filename: "log/ftp.log" } },
    categories: { default: { appenders: ["lion"], level: "debug" } }
});

function test() {
    logger.error('test error');
    logger.debug("Got cheese.");
    logger.info("Cheese is Comté.");
    logger.warn("Cheese is quite smelly.");
    logger.error("Cheese is too ripe!");
    logger.fatal("Cheese was breeding ground for listeria.");
};

function error(errorMsg = '') {
    console.log(errorMsg);
    logger.error(errorMsg);
};

function info(fnName, name, value) {
    let msg = `[${fnName}]: ${name} => ${JSON.stringify(value)}`;
    console.log(msg);
    logger.debug(msg);
};

function debug(info) {
    console.log(info);
    logger.info(info);
};

function loginInfo(options) {
    debug('login options: ');

    for (let key in options) {
        info('login', key, options[key]);
    }
}

function logList(list) {
    if (!list || !list.length) {
        debug('no file');
        return;
    }

    debug('file list on server: ');

    for (let fileInfo of list) {
        info('list', 'fileInfo', fileInfo);
    }
}

module.exports = {
    error,
    info,
    debug,
    loginInfo,
    logList
};