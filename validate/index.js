/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-19 10:45:28
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-26 09:08:03
 */

const logger = require('../log/index.js');
const validate = require('./common.js');

function validateLoginOptions(options) {

    Object.keys(options).forEach(key => {
        logger.info('validateEmpty is validated', key, validate.validateEmpty(options[key]))
        if (!validate.validateEmpty(options[key])) {
            logger.error(`[validateLoginOptions]: loginOptions error: ${key} can not be empty!`);
            return false;
        }

    });

    if (!validate.validateIp(options.host)) {
        logger.info('validateLoginOptions', 'options.host', options.host);
        logger.error('loginOptions error: host checked fail! please input an ip');
        return false;
    }

    if (!validate.validatePort(options.port)) {
        logger.info('validateLoginOptions', 'options.port', options.port);
        logger.error('loginOptions error: port checked fail! please input a port ');
        return false;
    }

    return true;
}


module.exports = {
    validateLoginOptions,
    validateEmpty: validate.validateEmpty
}