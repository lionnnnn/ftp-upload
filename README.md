# ftp-upload

> 基于 ftp、ssh2-sftp-client 实现的上传工具


## Basic Usage

```js

const uploader = require('./src/uploader/index.js');

async function main() {
    await uploader.connect({
        host: '1.1.1.1',
        port: 21,
        user: 'xxx',
        password: 'xxxx',
        sftp: false
    });
    await uploader.upload('./upload_files', '/yjc/');
    await uploader.list('/yjc/');
    await uploader.close();
};

main();

```



### connect (options)

 连接服务，参数如下

```js

let options = {
    host: '',
    port: 21,
    user: '',
    password: '',
    sftp: false
};
```


### upload(path, destPath)

上传本地文件到远程 支持 单文件 目录 glob上传

- path：必选，本地路径 可以是单文件也可以是目录
- destPath：必选，远程要上传到的目的路径

#### Usage

```js
// 文件上传
uploader.connect({
        host: '1.1.1.1',
        port: 21,
        user: 'xxx',
        password: 'xxxx',
        sftp: false
    })
    .then(() => {
        uploader.upload('./test.txt', '/root/');
    })
    .then(() => {
        uploader.close();
    });

// 目录上传
uploader.connect({
        host: '1.1.1.1',
        port: 21,
        user: 'xxx',
        password: 'xxxx',
        sftp: false
    })
    .then(() => {
        uploader.upload('./test/', '/root/');
    })
    .then(() => {
        uploader.close();
    });
```

### list(destPath)

查看服务器上的文件/文件夹

- destPath：必选，接收一个`string`

### close()

关闭连接

### 