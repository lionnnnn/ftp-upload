/*
 * @Description: Description
 * @Author: jacksonyyy
 * @Date: 2020-12-26 10:17:06
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-26 14:01:36
 */

const ftp = require('../ftp/index.js');
let client = new ftp.ftp();

test('login 用户名密码正确', async() => {
    expect.assertions(1);
    const data = await ftp.login(client, {
        host: '47.107.157.97',
        port: 21,
        user: 'ftp',
        password: 'Admin@123'
    });
    expect(data).toEqual({
        host: '47.107.157.97',
        port: 21,
        user: 'ftp',
        password: 'Admin@123'
    });
});

test('login 数据为空', async() => {
    expect.assertions(1);
    const data = await ftp.login(client, {
        host: '',
        port: 21,
        user: '',
        password: ''
    }).catch((err) => {
        expect(err).toBe('login failed, please correct and retry');

    });
});

// test('测试jest.fn()返回Promise', async() => {
//     let mockFn = jest.fn(ftp.login).mockResolvedValue('default');
//     let result = await mockFn();
//     // 断言mockFn通过await关键字执行后返回值为default
//     expect(result).toBe('default');
//     // 断言mockFn调用后返回的是Promise对象
//     expect(Object.prototype.toString.call(mockFn())).toBe("[object Promise]");
// })

// test('list 远程地址存在', async() => {
//     expect.assertions(1);
//     const data = await ftp.list(client, '/ycy/');
//     expect(data).toBe(['yjc']);
// });