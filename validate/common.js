/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-19 11:19:11
 * @LastEditors: lion
 * @LastEditTime: 2020-12-19 17:22:39
 */

const ipReg = /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g;
const portReg = /^([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;

function validateEmpty(value) {
    if (Array.isArray(value) && !value.length) {
        return false;
    }

    // TODO: commander要是直接 -d 会传true 先这样处理下
    return !!value || value !== true;
}


function validateIp(ip) {
    return ipReg.test(ip);
}

function validatePort(port) {
    return portReg.test(port);
}

module.exports = {
    validateEmpty,
    validateIp,
    validatePort
}