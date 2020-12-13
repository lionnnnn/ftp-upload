/*
 * @Description: Description
 * @Author: jacksonyyy
 * @Date: 2020-12-12 15:12:26
 * @LastEditors: jacksonyyy
 * @LastEditTime: 2020-12-12 17:43:00
 */



async function main() {
    await new Promise.all([test1(), test2(), test3()]);
}
main();

function test1() {
    return new Promise((res, rej) => {
        console.log('start1');
        setTimeout(() => {
            console.log(1);
            res(1);
        }, 100);
    })
}

function test2() {
    return new Promise((res, rej) => {
        console.log('start2');
        setTimeout(() => {
            console.log(2);
            res(2);
        }, 200);
    })
}

function test3() {
    return new Promise((res, rej) => {
        console.log('start3');
        setTimeout(() => {
            console.log(3);
            res(3);
        }, 300);
    })
}