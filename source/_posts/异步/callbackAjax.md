---
title: 回调函数 和 ajax
category: 异步
date: 2020-12-18
top: 100
---


## 为什么要有异步

JS 是单线程的语言，如果发送一个网络请求，要一直等待它返回，肯定是不行的


## 常用的异步操作

开发中比较常用的异步操作有：

网络请求，如ajax http.get
IO 操作，如readFile readdir
定时函数，如setTimeout setInterval

## 异步的实现原理/ 传统的$.ajax

先看一段比较常见的代码

```js
var ajax = $.ajax({
  url: '/data/data1.json',
  success: function () {
    console.log('success')
  }
})

console.log(ajax) // 返回一个 XHR 对象
```
上面代码中$.ajax()需要传入两个参数进去，url和success，其中url是请求的路由，success是一个函数。**这个函数传递过去不会立即执行，而是等着请求成功之后才能执行。对于这种传递过去不执行，等出来结果之后再执行的函数，叫做callback，即回调函数**


## 1.5 版本之后的$.ajax
但是从v1.5开始，以上代码就可以这样写了：可以链式的执行done或者fail方法

```js
var ajax = $.ajax('data.json')
ajax.done(function () {
        console.log('success 1')
    })
    .fail(function () {
        console.log('error')
    })
    .done(function () {
         console.log('success 2')
    })

console.log(ajax) // 返回一个 deferred 对象
```

大家注意看以上两段代码中都有一个console.log(ajax)，但是返回值是完全不一样的。

v1.5之前，返回的是一个XHR对象，这个对象不可能有done或者fail的方法的
v1.5开始，返回一个deferred对象，这个对象就带有done和fail的方法，并且是等着请求返回之后再去调用

### 改进之后的好处

是一个标志性的改造，不管这个概念是谁最先提出的，它在 jquery 中首先大量使用并让全球开发者都知道原来 ajax 请求还可以这样写。这为以后的Promise标准制定提供了很大意义的参考，你可以以为这就是后面Promise的原型。

之前无论是什么操作，我都需要一股脑写到callback中，现在不用了。现在成功了就写到done中，失败了就写到fail中，如果成功了有多个步骤的操作，那我就写很多个done，然后链式连接起来就 OK 了。

### 和后来的Promise的关系

以上的这段代码，我们还可以这样写。即不用done和fail函数，而是用then函数。then函数的第一个参数是成功之后执行的函数（即之前的done），第二个参数是失败之后执行的函数（即之前的fail）。而且then函数还可以链式连接。

```js
var ajax = $.ajax('data.json')
ajax.then(function () {
    console.log('success 1')
  }, function () {
    console.log('error 1')
  })
  .then(function () {
    console.log('success 2')
  }, function () {
    console.log('error 2')
  })
```

## 写一个传统的异步操作

给出一段非常简单的异步操作代码，使用setTimeout函数。

```js
var wait = function () {
    var task = function () {
        console.log('执行完成')
    }
    setTimeout(task, 2000)
}
wait()
```

以上这些代码执行的结果大家应该都比较明确了，即 2s 之后打印出执行完成。**但是我如果再加一个需求 ———— 要在执行完成之后进行某些特别复杂的操作，代码可能会很多，而且分好几个步骤 ———— 那该怎么办？**

如果你不看下面的内容，而且目前还没有Promise的这个思维，那估计你会说：直接在task函数中写就是了！不过相信你看完下面的内容之后，会放弃你现在的想法。


### 使用$.Deferred封装

接下来我们让刚才简单的几行代码变得更加复杂。**为何要变得更加复杂？是因为让以后更加复杂的地方变得简单。这里我们使用了 jquery 的$.Deferred，至于这个是什么，先不用关心，只需要知道$.Deferred()会返回一个deferred对象**

```js
function waitHandle() {
  var dtd = $.Deferred()  // 创建一个 deferred 对象，一个deferred对象会有done fail和then方法

  var wait = function (dtd) {  // 要求传入一个 deferred 对象
    var task = function () {
      console.log('执行完成')
      dtd.resolve()  // 表示异步任务已经完成
    }
    setTimeout(task, 2000)
    return dtd  // 要求返回 deferred 对象
  }

  return wait(dtd) // 返回的是wait函数里执行了resolve的dtd
}
```

然后应用then方法
```js
var w = waitHandle()
w.then(function () {
  console.log('ok 1')
}, function () {
  console.log('err 1')
}).then(function () {
  console.log('ok 2')
}, function () {
  console.log('err 2')
})
```

有同学肯定发现了，代码中console.log('err 1')和console.log('err 2')什么时候会执行呢 ———— 你自己把waitHandle函数中的dtd.resolve()改成dtd.reject()试一下就知道了。

dtd.resolve() 表示革命已经成功，会触发then中第一个参数（函数）的执行，
dtd.reject() 表示革命失败了，会触发then中第二个参数（函数）执行


### 有什么问题？

总结一下一个deferred对象具有的函数属性，并分为两组：

dtd.resolve dtd.reject
dtd.then dtd.done dtd.fail
我为何要分成两组 ———— 这两组函数，从设计到执行之后的效果是完全不一样的。第一组是主动触发用来改变状态（成功或者失败），第二组是状态变化之后才会触发的监听函数。

既然是完全不同的两组函数，就应该彻底的分开，否则很容易出现问题。例如，你在刚才执行代码的最后加上这么一行试试。
```js
w.reject()
```

那么如何解决这一个问题？我们把wait函数的return稍微改动一下就可以了

```
return dtd.promise()  // 注意，这里返回的是 primise 而不是直接返回 deferred 对象
```

改动的一行在这里return dtd.promise()，之前是return dtd。dtd是一个deferred对象，而dtd.promise就是一个promise对象。

promise对象和deferred对象最重要的区别，记住了————**promise对象相比于deferred对象，缺少了.resolve和.reject这俩函数属性**。这么一来，如果调用w.reject()，程序就会直接报错。


### 返回promise的好处

上一节提到deferred对象有两组属性函数，而且提到应该把这两组彻底分开。现在通过上面一行代码的改动，就分开了。

waitHandle函数内部，使用dtd.resolve()来该表状态，做主动的修改操作
waitHandle最终返回promise对象，只能去被动监听变化（then函数），而不能去主动修改操作
一个“主动”一个“被动”，完全分开了。


## promise 的概念

jquery v1.5 版本发布时间距离现在（2017年初春）已经老早之前了，那会儿大家网页标配都是 jquery 。无论里面的deferred和promise这个概念和想法最早是哪位提出来的，但是最早展示给全世界开发者的是 jquery ，这算是Promise这一概念最先的提出者。


## 回调

### 回调嵌套

使用回调，我们很有可能会将业务代码写成如下这种形式：

```js
doA( function(){ // 异步回调函数
    doB();

    doC( function(){
        doD();
    } )

    doE();
} );

doF();
```

当然这是一种简化的形式，经过一番简单的思考，我们可以判断出执行的顺序为：
```js
doA()
doF()
doB()
doC()
doE()
doD()
```
然而在实际的项目中，代码会更加杂乱，为了排查问题，我们需要绕过很多碍眼的内容，不断的在函数间进行跳转，使得排查问题的难度也在成倍增加。

当然之所以导致这个问题，其实是因为`这种嵌套的书写方式跟人线性的思考方式相违和`，以至于我们要多花一些精力去思考真正的执行顺序，嵌套和缩进只是这个思考过程中转移注意力的细枝末节而已。

当然了，与人线性的思考方式相违和，还不是最糟糕的，实际上，我们还会在代码中加入各种各样的逻辑判断，就比如在上面这个例子中，doD() 必须在 doC() 完成后才能完成，万一 doC() 执行失败了呢？我们是要重试 doC() 吗？还是直接转到其他错误处理函数中？当我们将这些判断都加入到这个流程中，很快代码就会变得非常复杂，以至于无法维护和更新。

### 回调地狱

我们先看一个简单的回调地狱的示例。

现在要找出一个目录中最大的文件，处理步骤应该是：

- 用 fs.readdir 获取目录中的文件列表；
- 循环遍历文件，使用 fs.stat 获取文件信息
- 比较找出最大文件；
- 以最大文件的文件名为参数调用回调。

代码为：
```js
var fs = require('fs');
var path = require('path');

function findLargest(dir, cb) {
    // 读取目录下的所有文件
    fs.readdir(dir, function(er, files) {
        if (er) return cb(er);

        var counter = files.length;
        var errored = false;
        var stats = [];

        files.forEach(function(file, index) {
            // 读取文件信息
            fs.stat(path.join(dir, file), function(er, stat) {

                if (errored) return;

                if (er) {
                    errored = true;
                    return cb(er);
                }

                stats[index] = stat;

                // 事先算好有多少个文件，读完 1 个文件信息，计数减 1，当为 0 时，说明读取完毕，此时执行最终的比较操作
                if (--counter == 0) {

                    var largest = stats
                        .filter(function(stat) { return stat.isFile() })
                        .reduce(function(prev, next) {
                            if (prev.size > next.size) return prev
                            return next
                        })

                    cb(null, files[stats.indexOf(largest)])
                }
            })
        })
    })
}
```
你可以将以上代码复制到一个比如 index.js 文件，然后执行 node index.js 就可以打印出最大的文件的名称。

看完这个例子，我们再来聊聊回调地狱的其他问题：

#### 1.难以复用

回调的顺序确定下来之后，想对其中的某些环节进行复用也很困难，牵一发而动全身。

举个例子，如果你想对 fs.stat 读取文件信息这段代码复用，因为回调中引用了外层的变量，提取出来后还需要对外层的代码进行修改。




