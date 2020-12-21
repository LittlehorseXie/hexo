---
title: ES7 中引入 async-await
category: 异步
date: 2020-12-19
top: 90
---


可以理解为是Generator的语法糖

async function代替了function*，await代替了yield，其他的再没有什么区别了。哦，还有，使用async-await时候不用再引用co这种第三方库了，直接执行即可


await后面必须跟一个Promise对象，跟其他类型的数据也OK，但是会直接同步执行，而不是异步。

返回的是个Promise对象


## 异步操作代码的变化

最后我们来感受一下，从一开始callback方式到后来的async-await方式，前前后后编写异步代码的变化。从变化中就可以体会到，确实越来越简洁，越来越易读。

### callback方式

```js
fs.readFile('some1.json', (err, data) => {
    fs.readFile('some2.json', (err, data) => {
        fs.readFile('some3.json', (err, data) => {
            fs.readFile('some4.json', (err, data) => {

            })
        })
    })
})
```

### Promise方式

```js
readFilePromise('some1.json').then(data => {
    return readFilePromise('some2.json')
}).then(data => {
    return readFilePromise('some3.json')
}).then(data => {
    return readFilePromise('some4.json')
})
```

### Generator方式

```js
co(function* () {
    const r1 = yield readFilePromise('some1.json')
    const r2 = yield readFilePromise('some2.json')
    const r3 = yield readFilePromise('some3.json')
    const r4 = yield readFilePromise('some4.json')
})
```

### async-await方式

```js
const readFileAsync = async function () {
    const f1 = await readFilePromise('data1.json')
    const f2 = await readFilePromise('data2.json')
    const f3 = await readFilePromise('data3.json')
    const f4 = await readFilePromise('data4.json')
}
```

