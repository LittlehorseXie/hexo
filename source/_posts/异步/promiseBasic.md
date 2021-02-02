---
title: Promises使用
category: 异步
date: 2020-12-18
top: 98
---

从 jquery v1.5 发布经过若干时间之后，Promise 终于出现在了 ES6 的标准中，而当下 ES6 也正在被大规模使用。

## 写一段传统的异步操作

```js
var wait = function () {
  var task = function () {
    console.log('执行完成')
  }
  setTimeout(task, 2000)
}
wait()
```

## 用Promise进行封装

```js
var wait = function() {
  return new Promise((resolve) => {
    var task = function () {
      console.log('执行完成')
      resolve()
    }
    setTimeout(task, 2000)
  })
}
const w = wait()
w.then(() => {
    console.log('ok 1')
}, () => {
    console.log('err 1')
}).then(() => {
    console.log('ok 2')
}, () => {
    console.log('err 2')
})
```


## Promise 在 ES6 中的具体应用

先准备一个读取文件的promise
```js
const fs = require('fs')
const path = require('path')  // 后面获取文件路径时候会用到
const readFilePromise = function (fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if (err) {
        reject(err)  // 这里执行 reject 是传递了参数，后面会有地方接收到这个参数
      } else {
        resolve(data.toString())  // 这里执行 resolve 时传递了参数，后面会有地方接收到这个参数
      }
    })
  })
}
```

### .then

然后使用封装好的readFilePromise进行读取文件 -- ../data/data2.json，这个文件内容非常简单：{"a":100, "b":200}
```js
const fullFileName = path.resolve(__dirname, '../data/data2.json')
const result = readFilePromise(fullFileName)
result.then(data => {
    console.log(data)
})
```

这时，新增一个需求，在打印出文件内容之后，我还想看看a属性的值
```js
result.then(data => {
    // 第一步操作
    console.log(data)
    return JSON.parse(data).a  // 这里将 a 属性的值 return
}).then(a => {
    // 第二步操作
    console.log(a)  // 这里可以获取上一步 return 过来的值
})
```

### .catch

为了健壮性，我们再加上异常捕获
我们知道then会接收两个参数（函数），第一个参数会在执行resolve之后触发（还能传递参数），第二个参数会在执行reject之后触发（其实也可以传递参数，和resolve传递参数一样），但是上面的例子中，我们没有用到then的第二个参数。这是为何呢 ———— 因为不建议这么用。

对于Promise中的异常处理，我们建议用catch方法，而不是then的第二个参数。请看下面的代码，以及注释。

```js
result.then(data => {
    console.log(data)
    return JSON.parse(data).a
}).then(a => {
    console.log(a)
}).catch(err => {
    console.log(err.stack)  // 这里的 catch 就能捕获 readFilePromise 中触发的 reject ，而且能接收 reject 传递的参数
})
```

在若干个then串联之后，我们一般会在最后跟一个.catch来捕获异常，而且执行reject时传递的参数也会在catch中获取到。这样做的好处是：
- 让程序看起来更加简洁，是一个串联的关系，没有分支（如果用then的两个参数，就会出现分支，影响阅读）
- 看起来更像是try - catch的样子，更易理解

### 串联多个异步操作
刚刚我们举了读取一个文件的例子，那如果读取多个呢？比如读完文件1再读文件2再读文件3...
```js
const fullFileName1 = path.resolve(__dirname, '../data/data1.json')
const result1 = readFilePromise(fullFileName1)
const fullFileName2 = path.resolve(__dirname, '../data/data2.json')
const result2 = readFilePromise(fullFileName2)
result1.then(data => {
  console.log('data1.data', data)
  return result2
}).then(data => {
  console.log('data2.data', data)
})
```
如果前面步骤返回值是一个Promise对象，后面的then将会被当做这个返回的Promise的第一个then来对待

### Promise.all和Promise.race

我还得继续提出更加奇葩的需求，以演示Promise的各个常用功能。如下需求：
读取两个文件data1.json和data2.json，现在我需要一起读取这两个文件，等待它们全部都被读取完，再做下一步的操作。此时需要用到Promise.all

```js
// Promise.all 接收一个包含多个 promise 对象的数组
Promise.all([result1, result2]).then(datas => {
    // 接收到的 datas 是一个数组，依次包含了多个 promise 返回的内容
    console.log(datas[0])
    console.log(datas[1])
})
```

读取两个文件data1.json和data2.json，现在我需要一起读取这两个文件，但是只要有一个已经读取了，就可以进行下一步的操作。此时需要用到Promise.race

// Promise.race 接收一个包含多个 promise 对象的数组
Promise.race([result1, result2]).then(data => {
    // data 即最先执行完成的 promise 的返回值
    console.log(data)
})

### Promise.resolve

从 jquery 引出，到此即将介绍完 ES6 的Promise，现在我们再回归到 jquery 。
大家都是到 jquery v1.5 之后$.ajax()返回的是一个deferred对象，而这个deferred对象和我们现在正在学习的Promise对象已经很接近了，但是还不一样。那么 ———— deferred对象能否转换成 ES6 的Promise对象来使用？？

答案是能！需要使用Promise.resolve来实现这一功能，请看以下代码：

```js
// 在浏览器环境下运行，而非 node 环境
cosnt jsPromise = Promise.resolve($.ajax('/whatever.json'))
jsPromise.then(data => {
    // ...
})
```

实际上，并不是Promise.resolve对 jquery 的deferred对象做了特殊处理，而是Promise.resolve能够将thenable对象转换为Promise对象。什么是thenable对象？———— 看个例子

```js
// 定义一个 thenable 对象
const thenable = {
    // 所谓 thenable 对象，就是具有 then 属性，而且属性值是如下格式函数的对象
    then: (resolve, reject) => {
        resolve(200)
    }
}

// thenable 对象可以转换为 Promise 对象
const promise = Promise.resolve(thenable)
promise.then(data => {
    // ...
})
```

上面的代码就将一个thenalbe对象转换为一个Promise对象，只不过这里没有异步操作，所有的都会同步执行，但是不会报错的。

其实，在我们的日常开发中，这种将thenable转换为Promise的需求并不多。真正需要的是，将一些异步操作函数（如fs.readFile）转换为Promise（就像文章一开始readFilePromise做的那样）。这块，我们后面会在介绍Q.js库时，告诉大家一个简单的方法。

## Promise/A+ 规范

### 关于状态

promise 可能有三种状态：等待（pending）、已完成（fulfilled）、已拒绝（rejected）
promise 的状态只可能从“等待”转到“完成”态或者“拒绝”态，不能逆向转换，同时“完成”态和“拒绝”态不能相互转换


### 关于then方法

promise 必须实现then方法，而且then必须返回一个 promise ，同一个 promise 的then可以调用多次（链式），并且回调的执行顺序跟它们被定义时的顺序一致
then方法接受两个参数，第一个参数是成功时的回调，在 promise 由“等待”态转换到“完成”态时调用，另一个是失败时的回调，在 promise 由“等待”态转换到“拒绝”态时调用

## Promise 的局限性

### 1. 错误被吃掉

举个例子：
```js
const promise = new Promise(null);
console.log(233333);
```
以上代码依然会被阻断执行，这是因为如果通过无效的方式使用 Promise，并且出现了一个错误阻碍了正常 Promise 的构造，结果会得到一个立刻跑出的异常，而不是一个被拒绝的 Promise。

然而再举个例子：
```js
let promise = new Promise(() => {
    throw new Error('error')
});
console.log(2333333);
```
这次会正常的打印 233333，说明 Promise 内部的错误不会影响到 Promise 外部的代码，而这种情况我们就通常称为 “吃掉错误”。

其实这并不是 Promise 独有的局限性，try..catch 也是这样，同样会捕获一个异常并简单的吃掉错误。

而正是因为错误被吃掉，Promise 链中的错误很容易被忽略掉，这也是为什么会一般推荐在 Promise 链的最后添加一个 catch 函数，因为对于一个没有错误处理函数的 Promise 链，任何错误都会在链中被传播下去，直到你注册了错误处理函数。

### 2. 单一值
Promise 只能有一个完成值或一个拒绝原因，然而在真实使用的时候，往往需要传递多个值，一般做法都是构造一个对象或数组，然后再传递，then 中获得这个值后，又会进行取值赋值的操作，每次封装和解封都无疑让代码变得笨重。

说真的，并没有什么好的方法，建议是使用 ES6 的解构赋值：

Promise.all([Promise.resolve(1), Promise.resolve(2)])
.then(([x, y]) => {
    console.log(x, y);
});

### 3. 无法取消
Promise 一旦新建它就会立即执行，无法中途取消。

### 4. 无法得知 pending 状态
当处于 pending 状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成）。