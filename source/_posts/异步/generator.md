---
title: ES6 中的 Generator
category: 异步
date: 2020-12-19
top: 93
---

ES6 诞生以前，异步编程的方法，大概有下面四种。

> 回调函数
> 事件监听
> 发布/订阅
> Promise 对象

Generator 函数将 JavaScript 异步编程带入了一个全新的阶段。

## Generator简介

先来一段最基础的Generator代码

```js
function* Hello() {
  console.log(1)
  const a = yield 100
  console.log(2)
  const b = yield (function () {return 200})()
  console.log(3)
  return 300
}

var h = Hello() // Hello内部的代码不会立即执行，而是处于一个暂停状态
console.log(typeof h)  // object 而不是一个function

console.log(h.next())  // 1 { value: 100, done: false }
console.log(h.next())  // 2 { value: 200, done: false }
console.log(h.next())  // 3 { value: 300, done: true }
console.log(h.next())  // { value: undefined, done: true }
```

## Generator如何处理异步操作

上面只是一个最基本最简单的介绍，但是我们看不到任何与异步操作相关的事情，那我们接下来就先展示一下最终我们将使用Generator如何做异步操作。

之前讲解Promise时候，依次读取多个文件，我们是这么操作的（看不明白的需要回炉重造哈），主要是使用then做链式操作。

```js
readFilePromise('some1.json').then(data => {
  console.log(data)  // 打印第 1 个文件内容
  return readFilePromise('some2.json')
}).then(data => {
  console.log(data)  // 打印第 2 个文件内容
  return readFilePromise('some3.json')
}).then(data => {
  console.log(data)  // 打印第 3 个文件内容
  return readFilePromise('some4.json')
}).then(data=> {
  console.log(data)  // 打印第 4 个文件内容
})
```

而如果学会Generator那么读取多个文件就是如下这样写。先不要管如何实现的，光看一看代码，你就能比较出哪个更加简洁、更加易读、更加所谓的优雅！
```js
co(function* () {
  const res1 = await readFilePromise('some1.json')
  console.log(res1)
  const res2 = await readFilePromise('some2.json')
  console.log(res2)
  const res3 = await readFilePromise('some3.json')
  console.log(res3)
})
```

接下来我们不会立刻讲解如何使用 Generator 做异步操作，而是看一看Generator是一个什么东西

## Generator 和 Iterator 的关系

Generator返回的是一个Iterator对象

```js
function* Hello() {
  yield 100
  yield (function () {return 200})()
  return 300 
}
const h = Hello()
console.log(h[Symbol.iterator])  // [Function: [Symbol.iterator]]
```

## Generator 的具体应用

### next 方法的参数

我们之前已经知道，yield具有返回数据的功能，除此之外，next还可以向yield传递数据

```js
function* G() {
  const a = yield 100
  console.log('a', a)  // a aaa
  const b = yield 200
  console.log('b', b)  // b bbb
  const c = yield 300
  console.log('c', c)  // c ccc
}
const g = G()
g.next()    // value: 100, done: false
g.next('aaa') // value: 200, done: false
g.next('bbb') // value: 300, done: false
g.next('ccc') // value: undefined, done: true
```

有一个要点需要注意，就g.next('aaa')是将'aaa'传递给上一个已经执行完了的yield语句前面的变量，而不是即将执行的yield前面的变量

### 巧妙实现斐波那契数列

```js
function* fibonacci() {
  let [prev, curr] = [0, 1]
  for (;;) {
    [prev, curr] = [curr, prev + curr]
    // 将中间值通过 yield 返回，并且保留函数执行的状态，因此可以非常简单的实现 fibonacci
    yield curr
  }
}
for (let n of fibonacci()) {
  if (n > 1000) {
    break
  }
  console.log(n)
}
```

### yield*语句

如果有两个Generator，想要在第一个中包含第二个，如下需求：

```js
function* G1() {
  yield 'a'
  yield 'b'
}
function* G2() {
  yield 'x'
  yield 'y'
}
```

这就可以用到yield*表达式

```js
function* G1() {
  yield 'a'
  yield* G2()  // 使用 yield* 执行 G2()
  yield 'b'
}
function* G2() {
  yield 'x'
  yield 'y'
}
for (let item of G1()) {
  console.log(item)
}
```

之前学过的yield后面会接一个普通的 JS 对象，而yield*后面会接一个Generator，而且会把它其中的yield按照规则来一步一步执行。如果有多个Generator串联使用的话（例如Koa源码中），用yield*来操作非常方便。

## Thunk 函数

**Thunk 函数是自动执行 Generator 函数的一种方法**。

将参数放到一个临时函数之中，再将这个临时函数传入函数体。这个临时函数就叫做 Thunk 函数。

### 一个普通的异步函数

就用 nodejs 中读取文件的函数为例，通常都这么写

```js
fs.readFile('data1.json', 'utf-8', (err, data) => {
  // 获取文件内容
})
```
其实这个写法就是将三个参数都传递给fs.readFile这个方法，其中最后一个参数是一个callback函数。这种函数叫做 多参数函数，我们接下来做一个改造

### 封装成一个thunk函数

```js
const thunk = function (fileName, codeType) {
  // 返回一个只接受 callback 参数的函数
  return function (callback) {
    fs.readFile(fileName, codeType, callback)
  }
}
const readFileThunk = thunk('data1.json', 'utf-8')
readFileThunk((err, data) => {
  // 获取文件内容
})
```

是不是感觉越改造越复杂了？不过请相信：你看到的复杂仅仅是表面的，这一点东西变的复杂，是为了让以后更加复杂的东西变得简单。对于个体而言，随性比较简单，遵守规则比较复杂；但是对于整体（包含很多个体）而言，大家都随性就不好控制了，而大家都遵守规则就很容易管理

### 使用thunkify库

上面代码的封装，是我们手动来做的，但是没遇到一个情况就需要手动做吗？在这个开源的时代当让不会这样，直接使用第三方的thunkify就好了。

```js
const thunk = thunkify(fs.readFile)
const readFileThunk = thunk('data1.json', 'utf-8')
readFileThunk((err, data) => {
    // 获取文件内容
})
```

## Generator 与异步操作

### 在Genertor中使用thunk函数

这个比较简单了，之前都讲过的，直接看代码即可。代码中表达的意思，是要依次读取两个文件的内容

```js
const readFileThunk = thunkify(fs.readFile)
const gen = function* () {
  const r1 = yield readFileThunk('data1.json')
  console.log(r1)
  const r2 = yield readFileThunk('data2.json')
  console.log(r2)
}
```

### 挨个读取两个文件的内容

```js
const g = gen()

// g.next() 返回 {{ value: thunk函数, done: false }} 
// 下一行中，g.next().value 是一个 thunk 函数，它需要一个 callback 函数作为参数传递进去
g.next().value((err, data1) => {
    // data1 是第一个文件的内容,下一行中，g.next(data1) 将数据传给 r1 变量
    // g.next(data1).value 又是一个 thunk 函数，它又需要一个 callback 函数作为参数传递进去
    g.next(data1).value((err, data2) => {
        // 这里的 data2 是第二个文件的内容，通过 g.next(data2) 将数据传递个上面的 r2 变量
        g.next(data2)
    })
})
```
上面 6 行左右的代码，却用了 6 行左右的注释来解释，可见代码的逻辑并不简单。第一它逻辑复杂，第二它也不是那么易读、简洁呀，用Generator实现异步操作就是这个样子的？———— 当然不是，继续往下看。

### 自驱动流程

以上代码中，读取两个文件的内容都是手动一行一行写的，而我们接下来要做一个自驱动的流程，定义好Generator的代码之后，就让它自动执行。完整的代码如下所示：

```js
function run(gen) {
  const g = gen()
  function next(err, data) {
    let result = g.next() // 返回 { value: thunk函数, done: ... }
    if (result.done) {
      return
    } else {
      result.value(next) // result.value 需要一个 callback 函数作为参数，而 next 就是一个 callback 形式的函数
    }
  }
  next() // 手动执行以启动第一次 next
}
run(gen)
```

## co

刚才我们定义了一个run还是来做自助流程管理，是不是每次使用都得写一遍run函数呢？———— 肯定不是的，直接用大名鼎鼎的co就好了

```js
const c = co(gen)
```

而且const c = co(gen)返回的是一个Promise对象，可以接着这么写

```js
c.then(data => {
    console.log('结束')
})
```

## koa 中使用 Generator

koa 是一个 nodejs 开发的 web 框架，所谓 web 框架就是处理 http 请求的。开源的 nodejs 开发的 web 框架最初是 express。

express 使用的异步操作是传统的callbck，而 koa 用的是我们刚刚讲的Generator（koa v1.x用的是Generator，已经被广泛使用，而 koa v2.x用到了 ES7 中的async-await，不过因为 ES7 没有正式发布，所以 koa v2.x也没有正式发布）(2017年)

koa 是由 express 的原班开发人员开发的，比 express 更加简洁易用，因此 koa 是目前最为推荐的 nodejs web 框架。阿里前不久就依赖于 koa 开发了自己的 nodejs web 框架 egg


### koa 中如何应用Generator

koa 是一个 web 框架，处理 http 请求，但是这里我们不去管它如何处理 http 请求，而是直接关注它使用Genertor的部分————中间件。

例如，我们现在要用 3 个Generator输出12345，我们如下代码这么写

```js
let info = ''
function* g1() {
    info += '1'  // 拼接 1
    yield* g2()  // 拼接 234
    info += '5'  // 拼接 5
}
function* g2() {
    info += '2'  // 拼接 2
    yield* g3()  // 拼接 3
    info += '4'  // 拼接 4
}
function* g3() {
    info += '3'  // 拼接 3
}

var g = g1()
g.next()
console.log(info)  // 12345
```

但是如果用 koa 的 中间件 的思路来做，就需要如下这么写。
```js
const app = new Koa()
app.use(function *(next){
    this.body = '1';
    yield next;
    this.body += '5';
    console.log(this.body);
});
app.use(function *(next){
    this.body += '2';
    yield next;
    this.body += '4';
});
app.use(function *(next){
    this.body += '3';
});
app.listen()
```
解释几个关键点

- app.use()中传入的每一个Generator就是一个 中间件，中间件按照传入的顺序排列，顺序不能乱
- 每个中间件内部，next表示下一个中间件。yield next就是`先将程序暂停`，先去执行下一个中间件，等next被执行完之后，再回过头来执行当前代码的下一行。因此，koa 的中间件执行顺序是一种洋葱圈模型
- 每个中间件内部，this可以共享变量。即第一个中间件改变了this的属性，在第二个中间件中可以看到效果。

### koa 的这种应用机制是如何实现的


```js
class MyKoa {
  this.middlewares = [] // 存储所有的中间件
  use(generator) {
    this.middlewares.push(generator)
  }
  listen() {
    this._run()
  }
  _run() {
    const ctx = this
    const middlewares = ctx.middlewares
    co(function*() {
      while(middlewares.length) {
        let prev = null
        let i = middlewares.length
        //从最后一个中间件到第一个中间件的顺序开始遍历
        while (i--) {
          // ctx 作为函数执行时的 this 才能保证多个中间件中数据的共享
          // prev 将前面一个中间件传递给当前中间件，才使得中间件里面的 next 指向下一个中间件
          prev = middlewares[i].call(ctx, prev);
        }
        //执行第一个中间件
        yield prev;
      }
    })
  }
}
```


