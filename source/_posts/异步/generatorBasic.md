---
title: ES6 中的 Generator 语法
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

## Generator介绍

语法上，Generator 函数是一个状态机，封装了多个内部状态。执行 Generator 函数`会返回一个遍历器对象`，`代表 Generator 函数的内部指针`，返回的遍历器对象，可以依次遍历 Generator 函数内部的每一个状态。

形式上，Generator 函数是一个普通函数，但是有两个特征。一是，function关键字与函数名之间有一个`星号`；二是，函数体内部使用`yield表达式`，定义不同的内部状态（yield在英语里的意思就是“产出”）。

使用上，Generator 函数的调用方法与普通函数一样，也是在函数名后面加上一对圆括号。不同的是，调用 Generator 函数后，`该函数并不执行`，返回的也不是函数运行结果，而是`一个指向内部状态的指针对象`，也就是遍历器对象。必须调用遍历器对象的`next方法，使得指针移向下一个状态`。也就是说，每次调用next方法，内部指针就从函数头部或上一次停下来的地方开始执行，直到遇到下一个yield表达式（或return语句）为止。

换言之，Generator 函数是分段执行的，`yield表达式是暂停执行的标记`，而`next方法可以恢复执行`。

### 1. 星号

ES6 没有规定，function关键字与函数名之间的星号，写在哪个位置。这导致下面的写法都能通过。

```js
function * foo(x, y) { ··· }
function *foo(x, y) { ··· }
function* foo(x, y) { ··· }
function*foo(x, y) { ··· }
```
由于 Generator 函数仍然是普通函数，所以一般的写法是上面的第三种，即星号紧跟在function关键字后面。

### 2. yield 表达式

由于 Generator 函数返回的遍历器对象，只有调用next方法才会遍历下一个内部状态，所以其实提供了一种可以暂停执行的函数。yield表达式就是暂停标志。

yield表达式只能用在 Generator 函数里面
```js
(function (){
  yield 1;
})()
// 报错 SyntaxError: Unexpected number
```

yield表达式如果用在另一个表达式之中，必须放在圆括号里面
```js
function* demo() {
  console.log('Hello' + yield); // SyntaxError
  console.log('Hello' + yield 123); // SyntaxError

  console.log('Hello' + (yield)); // OK
  console.log('Hello' + (yield 123)); // OK
}
```

yield表达式用作函数参数或放在赋值表达式的右边，可以不加括号。
```js
function* demo() {
  foo(yield 'a', yield 'b'); // OK
  let input = yield; // OK
}
```

遍历器对象的next方法的运行逻辑如下。

（1）遇到yield表达式，就暂停执行后面的操作，并将紧跟在yield后面的那个表达式的值，作为返回的对象的value属性值。

（2）下一次调用next方法时，再继续往下执行，直到遇到下一个yield表达式。

（3）如果没有再遇到新的yield表达式，就一直运行到函数结束，直到return语句为止，并将return语句后面的表达式的值，作为返回的对象的value属性值。

（4）如果该函数没有return语句，则返回的对象的value属性值为undefined。


### 3. next方法

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

yield表达式本身没有返回值，或者说总是返回undefined。next方法可以带一个参数，该参数就会被当作上一个yield表达式的返回值。

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

这个功能有很重要的语法意义。Generator 函数从暂停状态到恢复运行，它的上下文状态（context）是不变的。通过next方法的参数，就有办法在 Generator 函数开始运行之后，继续向函数体内部注入值。也就是说，可以在 Generator 函数运行的不同阶段，从外部向内部注入不同的值，从而调整函数行为。

```js
function* foo(x) {
  var y = 2 * (yield (x + 1));
  var z = yield (y / 3);
  return (x + y + z);
}

var a = foo(5);
a.next() // Object{value:6, done:false}
a.next() // Object{value:NaN, done:false}
a.next() // Object{value:NaN, done:true}

var b = foo(5);
b.next() // { value:6, done:false }
b.next(12) // { value:8, done:false }
b.next(13) // { value:42, done:true }
```

注意，由于next方法的参数表示上一个yield表达式的返回值，所以在`第一次使用next方法时，传递参数是无效的`。V8 引擎直接忽略第一次使用next方法时的参数，只有从第二次使用next方法开始，参数才是有效的。从语义上讲，`第一个next方法用来启动遍历器对象`，所以不用带有参数。

### 4. yield*语句

用来在一个 Generator 函数里面执行另一个 Generator 函数。

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

```js
function* genFuncWithReturn() {
  yield 'a';
  yield 'b';
  return 'The result';
}
function* logReturned(genObj) {
  let result = yield* genObj;
  console.log(result);
}

[...logReturned(genFuncWithReturn())]
// The result
// 值为 [ 'a', 'b' ]
```

yield*命令可以很方便地取出嵌套数组的所有成员。
```js
function* iterTree(tree) {
  if (Array.isArray(tree)) {
    for(let i=0; i < tree.length; i++) {
      yield* iterTree(tree[i]);
    }
  } else {
    yield tree;
  }
}

const tree = [ 'a', ['b', 'c'], ['d', 'e'] ];

for(let x of iterTree(tree)) {
  console.log(x);
}
// a
// b
// c
// d
// e
```

由于扩展运算符...默认调用 Iterator 接口，所以上面这个函数也可以用于嵌套数组的平铺。

[...iterTree(tree)] // ["a", "b", "c", "d", "e"]

下面是一个稍微复杂的例子，使用yield*语句遍历完全二叉树。
```js
// 下面是二叉树的构造函数，
// 三个参数分别是左树、当前节点和右树
function Tree(left, label, right) {
  this.left = left;
  this.label = label;
  this.right = right;
}

// 下面是中序（inorder）遍历函数。
// 由于返回的是一个遍历器，所以要用generator函数。
// 函数体内采用递归算法，所以左树和右树要用yield*遍历
function* inorder(t) {
  if (t) {
    yield* inorder(t.left);
    yield t.label;
    yield* inorder(t.right);
  }
}

// 下面生成二叉树
function make(array) {
  // 判断是否为叶节点
  if (array.length == 1) return new Tree(null, array[0], null);
  return new Tree(make(array[0]), array[1], make(array[2]));
}
let tree = make([[['a'], 'b', ['c']], 'd', [['e'], 'f', ['g']]]);

// 遍历二叉树
var result = [];
for (let node of inorder(tree)) {
  result.push(node);
}

result
// ['a', 'b', 'c', 'd', 'e', 'f', 'g']
```


### 5. Generator.prototype.throw()

Generator 函数返回的遍历器对象，都有一个throw方法，可以在函数体外抛出错误，然后在 Generator 函数体内捕获。
```js
var g = function* () {
  try {
    yield;
  } catch (e) {
    console.log('内部捕获', e);
  }
};

var i = g();
i.next();

try {
  i.throw('a');
  i.throw('b');
} catch (e) {
  console.log('外部捕获', e);
}
// 内部捕获 a
// 外部捕获 b
```
上面代码中，遍历器对象i连续抛出两个错误。第一个错误被 Generator 函数体内的catch语句捕获。i第二次抛出错误，由于 Generator 函数内部的catch语句已经执行过了，不会再捕捉到这个错误了，所以这个错误就被抛出了 Generator 函数体，被函数体外的catch语句捕获。

throw方法抛出的错误要被内部捕获，前提是必须至少执行过一次next方法。
```js
function* gen() {
  try {
    yield 1;
  } catch (e) {
    console.log('内部捕获');
  }
}

var g = gen();
g.throw(1);
// Uncaught 1
```

上面代码中，g.throw(1)执行时，next方法一次都没有执行过。这时，抛出的错误不会被内部捕获，而是直接在外部抛出，导致程序出错。这种行为其实很好理解，因为第一次执行next方法，等同于启动执行 Generator 函数的内部代码，否则 Generator 函数还没有开始执行，这时throw方法抛错只可能抛出在函数外部。

```js
var gen = function* gen(){
  try {
    yield console.log('a');
  } catch (e) {
    // ...
  }
  yield console.log('b');
  yield console.log('c');
}

var g = gen();
g.next() // a
g.throw() // b
g.next() // c
```
上面代码中，g.throw方法被捕获以后，自动执行了一次next方法，所以会打印b。另外，也可以看到，只要 Generator 函数内部部署了try...catch代码块，那么遍历器的throw方法抛出的错误，不影响下一次遍历。


一旦 Generator 执行过程中抛出错误，且没有被内部捕获，就不会再执行下去了。如果此后还调用next方法，将返回一个value属性等于undefined、done属性等于true的对象，即 JavaScript 引擎认为这个 Generator 已经运行结束了。
```js
function* g() {
  yield 1;
  console.log('throwing an exception');
  throw new Error('generator broke!');
  yield 2;
  yield 3;
}

function log(generator) {
  var v;
  console.log('starting generator');
  try {
    v = generator.next();
    console.log('第一次运行next方法', v);
  } catch (err) {
    console.log('捕捉错误', v);
  }
  try {
    v = generator.next();
    console.log('第二次运行next方法', v);
  } catch (err) {
    console.log('捕捉错误', v);
  }
  try {
    v = generator.next();
    console.log('第三次运行next方法', v);
  } catch (err) {
    console.log('捕捉错误', v);
  }
  console.log('caller done');
}

log(g());
// starting generator
// 第一次运行next方法 { value: 1, done: false }
// throwing an exception
// 捕捉错误 { value: 1, done: false }
// 第三次运行next方法 { value: undefined, done: true }
// caller done
```
上面代码一共三次运行next方法，第二次运行的时候会抛出错误，然后第三次运行的时候，Generator 函数就已经结束了，不再执行下去了。

### 6. Generator.prototype.return() 

Generator 函数返回的遍历器对象，还有一个return()方法，可以返回给定的值，并且终结遍历 Generator 函数。
```js
function* gen() {
  yield 1;
  yield 2;
  yield 3;
}

var g = gen();

g.next()        // { value: 1, done: false }
g.return('foo') // { value: "foo", done: true }
g.next()        // { value: undefined, done: true }
```

如果 Generator 函数内部有try...finally代码块，且正在执行try代码块，那么return()方法会导致立刻进入finally代码块，执行完以后，整个函数才会结束。
```js
function* numbers () {
  yield 1;
  try {
    yield 2;
    yield 3;
  } finally {
    yield 4;
    yield 5;
  }
  yield 6;
}
var g = numbers();
g.next() // { value: 1, done: false }
g.next() // { value: 2, done: false }
g.return(7) // { value: 4, done: false }
g.next() // { value: 5, done: false }
g.next() // { value: 7, done: true }
```

### 7. next()、throw()、return() 的共同点

next()、throw()、return()这三个方法本质上是同一件事，可以放在一起理解。它们的作用都是让 Generator 函数恢复执行，并且使用不同的语句替换yield表达式。

next()是将yield表达式替换成一个值。
throw()是将yield表达式替换成一个throw语句。
return()是将yield表达式替换成一个return语句。


## Generator 和 Iterator 的关系
接下来我们看一看Generator是一个什么东西

### 1. Generator是遍历器生成函数
```js
var myIterable = {};
myIterable[Symbol.iterator] = function* () {
  yield 1;
  yield 2;
  yield 3;
};

[...myIterable] // [1, 2, 3]
```

### 2. Generator返回的是一个Iterator对象

```js
function* Hello() {
  yield 100
  yield (function () {return 200})()
  return 300 
}
const h = Hello()
console.log(h[Symbol.iterator])  // [Function: [Symbol.iterator]]
```

```js
function* gen(){
  // some code
}

var g = gen();

g[Symbol.iterator]() === g
// true
```

### 3. for...of 循环

for...of循环可以自动遍历 Generator 函数运行时生成的Iterator对象，且此时不再需要调用next方法。
```js
function* foo() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
  return 6;
}

for (let v of foo()) {
  console.log(v);
}
// 1 2 3 4 5
```
上面代码使用for...of循环，依次显示 5 个yield表达式的值。这里需要注意，`一旦next方法的返回对象的done属性为true，for...of循环就会中止，且不包含该返回对象`，所以上面代码的return语句返回的6，不包括在for...of循环之中。


### 4. 斐波那契数列

下面是一个利用 Generator 函数和for...of循环，实现斐波那契数列的例子。

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

除了for...of循环以外，扩展运算符（...）、解构赋值和Array.from方法内部调用的，都是遍历器接口。这意味着，它们都可以将 Generator 函数返回的 Iterator 对象，作为参数。

```js
function* numbers () {
  yield 1
  yield 2
  return 3
  yield 4
}

// 扩展运算符
[...numbers()] // [1, 2]

// Array.from 方法
Array.from(numbers()) // [1, 2]

// 解构赋值
let [x, y] = numbers();
x // 1
y // 2

// for...of 循环
for (let n of numbers()) {
  console.log(n)
}
// 1
// 2
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

## 作为对象属性的 Generator 函数

如果一个对象的属性是 Generator 函数，可以简写成下面的形式。
```js
let obj = {
  * myGeneratorMethod() {
    ···
  }
};
```
上面代码中，myGeneratorMethod属性前面有一个星号，表示这个属性是一个 Generator 函数。

它的完整形式如下，与上面的写法是等价的。
```js
let obj = {
  myGeneratorMethod: function* () {
    // ···
  }
};
```

## Generator 函数的this

Generator 函数内部没有this
```js
function* g() {
  this.a = 11;
}

let obj = g();
obj.next();
obj.a // undefined
```

Generator 函数也不能跟new命令一起用，会报错。
```js
function* F() {
  yield this.x = 2;
  yield this.y = 3;
}

new F()
// TypeError: F is not a constructor
```

那么，有没有办法让 Generator 函数返回一个正常的对象实例，既可以用next方法，又可以获得正常的this？


```js
function* F() {
  this.a = 1;
  yield this.b = 2;
  yield this.c = 3;
}
var obj = {};
var f = F.call(obj);

f.next();  // Object {value: 2, done: false}
f.next();  // Object {value: 3, done: false}
f.next();  // Object {value: undefined, done: true}

obj.a // 1
obj.b // 2
obj.c // 3
```

上面代码中，执行的是遍历器对象f，但是生成的对象实例是obj，有没有办法将这两个对象统一呢？

一个办法就是将obj换成F.prototype。

```js
function* F() {
  this.a = 1;
  yield this.b = 2;
  yield this.c = 3;
}
var f = F.call(F.prototype);

f.next();  // Object {value: 2, done: false}
f.next();  // Object {value: 3, done: false}
f.next();  // Object {value: undefined, done: true}

f.a // 1
f.b // 2
f.c // 3
```
再将F改成构造函数，就可以对它执行new命令了。

```js
function* gen() {
  this.a = 1;
  yield this.b = 2;
  yield this.c = 3;
}

function F() {
  return gen.call(gen.prototype);
}

var f = new F();

f.next();  // Object {value: 2, done: false}
f.next();  // Object {value: 3, done: false}
f.next();  // Object {value: undefined, done: true}

f.a // 1
f.b // 2
f.c // 3
```

