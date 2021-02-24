---
title: ES6 系列之异步处理实战
category: es6
date: 2021-2-2
top: 89
---

我们以查找指定目录下的最大文件为例，感受从

回调函数 -> Promise -> Generator -> Async

异步处理方式的改变。

## API 介绍

为了实现这个功能，我们需要用到几个 Nodejs 的 API，所以我们来简单介绍一下。

### fs.readdir

readdir 方法用于读取目录，返回一个包含文件和目录的数组。

### fs.stat

stat 方法的参数是一个文件或目录，它产生一个对象，该对象包含了该文件或目录的具体信息。此外，该对象还有一个 isFile() 方法可以判断正在处理的到底是一个文件，还是一个目录。

## 思路分析

我们基本的实现思路就是：

1. 用 fs.readdir 获取指定目录的内容信息
2. 循环遍历内容信息，使用 fs.stat 获取该文件或者目录的具体信息
3. 将具体信息储存起来
4. 当全部储存起来后，筛选其中的是文件的信息
5. 遍历比较，找出最大文件
6. 获取并返回最大文件

然后我们直接上代码吧。

## 回调函数

```js
var fs = require('fs');
var path = require('path');

function findLargest(dir, cb) {
  fs.readdir(dir, (err, files) => {
    if (er) return cb(er);
    var counter = files.length;
    var errored = false;
    var stats = [];
  })
}
```

```js
findLargest('./', (err, filename) => {
  if (err) {
    return console.err(err)
  }
  console.log('largest file was:', filename)
})
```


