/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-19 10:45:28
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 09:08:03
 */

const logger = require('../log/index.js');
const validate = require('./common.js');

logger.setPrefix('validate');


function validateLoginOptions(options) {

    let validateEmpty = Object.keys(options).filter(item => item !== 'sftp').every(key => {
        logger.debug('validateLoginOptions', key, validate.validateEmpty(options[key]))
        if (!validate.validateEmpty(options[key])) {
            logger.error('validateLoginOptions', `loginOptions error: ${key} can not be empty!`);
            return false;
        }
        return true;
    });

    // 不是每个都是true 可以直接return
    if (!validateEmpty) {
        return false;
    }

    if (!validate.validateIp(options.host)) {
        logger.debug('validateLoginOptions', 'options.host', options.host);
        logger.error('validateLoginOptions', 'loginOptions error: host checked fail! please input an ip');
        return false;
    }

    if (!validate.validatePort(options.port)) {
        logger.debug('validateLoginOptions', 'options.port', options.port);
        logger.error('validateLoginOptions', 'loginOptions error: port checked fail! please input a port ');
        return false;
    }

    return true;
}


module.exports = {
    validateLoginOptions,
    validateEmpty: validate.validateEmpty
}