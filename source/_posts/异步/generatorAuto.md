---
title: ES6 中的 Generator 自动执行
category: 异步
date: 2021-2-2
top: 91
---

## Generator 与异步操作

```js
var fetch = require('node-fetch');

function* gen(){
    var url = 'https://api.github.com/users/github';
    var result = yield fetch(url);
    console.log(result.bio);
}
```
为了获得最终的执行结果，你需要这样做：

```js
var g = gen(); // 1. 执行 Generator 函数，获取遍历器对象
var result = g.next(); // 2. 执行fetch那行代码

result.value.then(function(data){ // 3. 获取value里的promise，并执行.then方法
    return data.json(); // 4. 数据格式化
}).then(function(data){
    g.next(data); // 5. 执行完毕
});
```

上节我们只调用了一个接口，那如果我们调用了多个接口，使用了多个 yield，我们岂不是要在 then 函数中不断的嵌套下去

我们来看看执行多个异步任务的情况：

```js
var fetch = require('node-fetch');

function* gen() {
  var r1 = yield fetch('https://api.github.com/users/github');
  var r2 = yield fetch('https://api.github.com/users/github/followers');
  var r3 = yield fetch('https://api.github.com/users/github/repos');

  console.log([r1.bio, r2[0].login, r3[0].full_name].join('\n'));
}
```

为了获得最终的执行结果，你可能要写成：

```js
const g = gen()
const res1 = g.next()
res1.value.then(data => {
  return data.json()
}).then(data => {
  return g.next(data).value
}).then(data => {
  return data.json()
}).then(data => {
  return g.next(data).value
}).then(data => {
  return data.json()
}).then(data => {
  g.next(data)
})
```
但我知道你肯定不想写成这样

## 自动执行

其实，利用递归，我们可以这样写：

```js
function run(gen) {
  const g = gen()
  function next(data) {
    let res = g.next(data)
    if (res.done) return
    res.value.then(data => {
      return data.json()
    }).then(data => {
      next(data)
    })
  }
  next()
}
```

在 run 这个启动器函数中，我们在 then 函数中将数据格式化 data.json()，但在更广泛的情况下，比如 yield 直接跟一个 Promise，而非一个 fetch 函数返回的 Promise，因为没有 json 方法，代码就会报错。所以为了更具备通用性，连同这个例子和启动器，我们修改为：


```js
var fetch = require('node-fetch');

function* gen() {
    var r1 = yield fetch('https://api.github.com/users/github');
    var json1 = yield r1.json();
    var r2 = yield fetch('https://api.github.com/users/github/followers');
    var json2 = yield r2.json();
    var r3 = yield fetch('https://api.github.com/users/github/repos');
    var json3 = yield r3.json();

    console.log([json1.bio, json2[0].login, json3[0].full_name].join('\n'));
}

function run(gen) {
    var g = gen();
    function next(data) {
        var result = g.next(data);
        if (result.done) return;
        result.value.then(function(data) {
            next(data);
        });
    }
    next();
}

run(gen);
```

只要 yield 后跟着一个 Promise 对象，我们就可以利用这个 run 函数将 Generator 函数自动执行。


## 启动器函数

由此可以看到 Generator 函数的自动执行需要一种机制，即当异步操作有了结果，能够自动交回执行权。

而两种方法可以做到这一点。

（1）回调函数。将异步操作进行包装，暴露出回调函数，在回调函数里面交回执行权。

（2）Promise 对象。将异步操作包装成 Promise 对象，用 then 方法交回执行权。

在两种方法中，我们各写了一个 run 启动器函数，那我们能不能将这两种方式结合在一些，写一个通用的 run 函数呢？我们尝试一下：

### 第一版

```js
function run(gen) {
    var gen = gen();

    function next(data) {
        var result = gen.next(data);
        if (result.done) return;

        if (isPromise(result.value)) {
            result.value.then(function(data) {
                next(data);
            });
        } else {
            result.value(next)
        }
    }

    next()
}

function isPromise(obj) {
    return 'function' == typeof obj.then;
}

module.exports = run;
```
### 第二版

我们已经写了一个不错的启动器函数，支持 yield 后跟回调函数或者 Promise 对象。

现在有一个问题需要思考，就是我们如何获得 Generator 函数的返回值呢？又如果 Generator 函数中出现了错误，就比如 fetch 了一个不存在的接口，这个错误该如何捕获呢？

```js
function run(gen) {
    var gen = gen();
    return new Promise((resolve, reject) => {
      try{
        var result = gen.next(data);
      } catch (e) {
        return reject(e)
      }
      if (result.done) return resolve(result.value);
      const value = toPromise(result.value)
      value.then(function(data) {
        next(data);
      }, function(e) {
        reject(e)
      });
    })

    next()
}
function toPromise(obj) {
  if (isPromise(obj)) return obj;
  if ('function' == typeof obj) return thunkToPromise(obj);
  return obj;
}
function thunkToPromise(fn) {
  return new Promise((resolve, reject) => {
    fn((err, value) => {
      if (err) {
        reject(err)
      }
      resolve(value)
    })
  })
}
```

与第一版有很大的不同：

首先，我们返回了一个 Promise，当 result.done 为 true 的时候，我们将该值 resolve(result.value)，如果执行的过程中出现错误，被 catch 住，我们会将原因 reject(e)。

其次，我们会使用 thunkToPromise 将回调函数包装成一个 Promise，然后统一的添加 then 函数。在这里值得注意的是，在 thunkToPromise 函数中，我们遵循了 error first 的原则，这意味着当我们处理回调函数的情况时：
```js
// 模拟数据请求
function fetchData(url) {
    return function(cb) {
        setTimeout(function() {
            cb(null, { status: 200, data: url })
        }, 1000)
    }
}
```
在成功时，第一个参数应该返回 null，表示没有错误原因。

### 第三版

我们在第二版的基础上将代码写的更加简洁优雅一点，最终的代码如下：

```js
function run(gen) {
    var gen = gen();
    return new Promise((resolve, reject) => {
      if (typeof gen == 'function') gen = gen()

      if (!gen || typeof gen.next !== 'function') return resolve(gen)

      function onFulfilled(res) {
        var ret;
        try {
            ret = gen.next(res);
        } catch (e) {
            return reject(e);
        }
        next(ret);
      }

      function onRejected(err) {
        var ret;
        try {
            ret = gen.throw(err);
        } catch (e) {
            return reject(e);
        }
        next(ret);
      }

      function next(ret) {
        if (ret.done) return resolve(ret.value);
        const value = toPromise(ret.value)
        if (value && isPromise(value)) return value.then(onFulfilled, onRejected)
        return onRejected(new TypeError('You may only yield a function, promise ' +
                'but the following object was passed: "' + String(ret.value) + '"'));
      }

    })

    next()
}
```


## co

如果我们再将这个启动器函数写的完善一些，我们就相当于写了一个 co，实际上，上面的代码确实是来自于 co……

而 co 是什么？ co 是大神 TJ Holowaychuk 于 2013 年 6 月发布的一个小模块，用于 Generator 函数的自动执行。

如果直接使用 co 模块，这两种不同的例子可以简写为：

```js
var fetch = require('node-fetch');
var co = require('co');

function* gen() {
    var r1 = yield fetch('https://api.github.com/users/github');
    var json1 = yield r1.json();
    var r2 = yield fetch('https://api.github.com/users/github/followers');
    var json2 = yield r2.json();
    var r3 = yield fetch('https://api.github.com/users/github/repos');
    var json3 = yield r3.json();

    console.log([json1.bio, json2[0].login, json3[0].full_name].join('\n'));
}

const c = co(gen)
```

而且const c = co(gen)返回的是一个Promise对象，可以接着这么写

```js
c.then(data => {
    console.log('结束')
})
```
