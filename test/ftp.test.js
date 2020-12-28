/*
 * @Description: Description
 * @Author: lion
 * @Date: 2020-12-26 10:17:06
 * @LastEditors: lion
 * @LastEditTime: 2020-12-26 17:49:53
 */

const ftp = require('ftp');
const { up } = require('inquirer/lib/utils/readline');

const uploader = require('../src/uploader/index.js');


jest.mock('ftp', () => {
    return jest.fn().mockImplementation(() => {

        return {
            connect: jest.fn(() => {}),
            put: jest.fn((path, destPath, cb) => {
                if (path === './upload_files/' && destPath === '/yjc/') {
                    cb();
                } else {
                    cb('no such destination path');
                }

            }),
            list: jest.fn((destPath, cb) => {
                if (destPath[0] === '/yjc/') {
                    cb(null, [{
                        "date": '2020-12-12T07:37:00.000Z',
                        "name": "text1.txt",
                        "size": 9,
                        "type": "-",
                    }]);
                } else {
                    cb({
                        code: 550
                    })
                }
            }),
            end: jest.fn(() => {}),
            on: jest.fn((status, cb) => {
                if (status && cb) {
                    cb();
                }
            })
        };
    });
}); 


test('login 用户名密码正确', async() => {
    expect.assertions(1);
    const data = await uploader.connect({
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

test('login 部分数据为空', async() => {
    expect.assertions(1);

    await uploader.connect({
        host: '',
        port: 21,
        user: '',
        password: ''
    }).catch((err) => {
        expect(err).toBe();
    });

});

test('list 远程路径正确', async() => {
    expect.assertions(1);
    const data = await uploader.list('/yjc/');
    expect(data).toEqual([{
        "date": '2020-12-12T07:37:00.000Z',
        "name": "text1.txt",
        "size": 9,
        "type": "-",
    }]);
});

test('list 远程路径为空', async() => {
    expect.assertions(1);

    const data = await uploader.list('').catch((err) => {
        expect(err).toBe('[list error]: destination path can not be empty');
    });

});

test('list 远程路径不存在', async() => {
    expect.assertions(1);

    const data = await uploader.list('xxx').catch((err) => {
        expect(err).toBe('[list error]: The system cannot find the files specified.');
    });

});

test('upload 本地路径为空', async() => {
    expect.assertions(1);

    const data = await uploader.upload('', '/yjc/').catch((err) => {
        expect(err).toBe('[upload] path can not be empty!');
    });

});

test('upload 本地路径不存在', async() => {
    expect.assertions(1);

    const data = await uploader.upload('xxx', '/yjc/').catch((err) => {
        expect(err).toEqual('[upload error]: can not find files to upload');
    });

});

test('upload 远程路径为空', async() => {
    expect.assertions(1);

    const data = await uploader.upload('./upload_files/', '').catch((err) => {
        expect(err).toEqual('[upload] destination path can not be empty!');
    });

});


test('upload 上传成功', async() => {
    expect.assertions(1);

    const data = await uploader.upload('./upload_files/', '/yjc/');
    expect(data).toEqual([ 'szy20201219.txt', 'test20201212-1.txt', 'test502-1.txt' ]);

});

test('close 关闭服务成功', async() => {
    expect.assertions(1);

    const data = await uploader.close();
    expect(data).toEqual();

});