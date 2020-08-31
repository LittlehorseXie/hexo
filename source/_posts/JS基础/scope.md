---
title: 作用域、作用域链
category: JS基础
date: 2020-08-28 11:40
top: 100
---

## 一、作用域

作用域是在运行代码时代码中某些特定部分中变量、函数和对象的可访问性，简单来说 就是代码中的某一行能不能访问某个变量

举个例子
```js
var outVariable = "我是最外层变量"; //最外层变量
function outFun() { //最外层函数
    var inVariable = "内层变量";
    function innerFun() { //内层函数
        console.log(inVariable);
    }
    innerFun();
}
console.log(outVariable); //我是最外层变量
outFun(); //内层变量
console.log(inVariable); //inVariable is not defined
innerFun(); //innerFun is not defined
```
从上面的例子可以体会到作用域的概念，变量inVariable在全局作用域没有声明，所以在全局作用域使用会报错
我们可以这样理解：作用域就是一个独立的地盘，让变量不会外泄，也就是说作用域最大的作用就是隔离变量，不同作用域下同名变量不会冲突

### 1. 全局作用域

上面的例子我们已经体会到 
> 最外层函数 和 最外层函数外面定义的变量拥有全局作用域

除此之外
> 所有`未定义直接赋值`的变量`自动声明为全局作用域`

```js
function outFun2() {
    variable = "未定义直接赋值的变量";
    var inVariable2 = "内层变量2";
}
outFun2(); // 要先执行这个函数，否则根本不知道里面是啥
console.log(variable); //未定义直接赋值的变量
console.log(inVariable2); //inVariable2 is not defined
```
> 所有window对象的属性拥有全局作用域

全局作用域的弊端是：污染全局命名空间，容易引起命名冲突。这就是为什么jQuery、Zepto等库的源码，所有的代码都会放在(function(){....})()中。因为放在这里，不会污染外面，也不会被外面污染，这就是函数作用域的一个体现。

### 2. 函数作用域

函数作用域，是指声明在函数内部的变量，和全局作用域相反，函数作用域一般只能在固定的代码片段内部访问

值得注意的是：**块语句（大括号“｛｝”中间的语句），如 if 和 switch 条件语句或 for 和 while 循环语句，不像函数，它们不会创建一个新的作用域**。在块语句中定义的变量将保留在它们已经存在的作用域中。

```js
for (let i = 0; i < 10; i++) {
  var j = 1
}
console.log(j); // 1 既然var不是函数作用域，那就是全局作用域
```

### 3. 块级作用域

es6之前没有块级作用域，只有全局作用域和函数作用域，es6的到来为我们提供了块级作用域，通过`let const`实现

比如和上一段代码片段作为对照：

```js
for (let i = 0; i < 10; i++) {
  let k = 1
}
console.log(k); // Uncaught ReferenceError: k is not defined
```

#### 不允许重复声明
```js
var a = 1
var a = 2 // 正常执行
let a = 3 // Uncaught SyntaxError: Identifier 'a' has already been declared
let b = 1
let b = 2 // Uncaught SyntaxError: Identifier 'b' has already been declared
```


#### 列几个代码片段感受一下var和let的区别

开发者可能最希望实现for循环的块级作用域了，因为可以把声明的计数器变量限制在循环内

```js
for (let i = 0; i < 10; i++) {
}
console.log(i); // Uncaught ReferenceError: i is not defined
```

```js
for (var i = 0; i < 10; i++) {
}
console.log(i); // 10
```


```js
var a = [];
for (var i = 0; i < 10; i++) {
  a[i] = function () {
    console.log(i);
  };
}
a[6](); // 10
```
上面代码中，变量i是var命令声明的，在全局范围内都有效，所以全局只有一个变量i。每一次循环，变量i的值都会发生改变，而循环内被赋给数组a的函数内部的console.log(i)，里面的i指向的就是全局的i。也就是说，所有数组a的成员里面的i，指向的都是同一个i，导致运行时输出的是最后一轮的i的值，也就是 10。

```js
var a = [];
for (let i = 0; i < 10; i++) {
  a[i] = function () {
    console.log(i);
  };
}
a[6](); // 6
```
上面代码中，变量i是let声明的，当前的i只在本轮循环(块级作用域)有效，所以每一次循环的i其实都是一个新的变量，所以最后输出的是6。

另外，for循环还有一个特别之处，就是设置循环变量的那部分是一个父作用域，而循环体内部是一个单独的子作用域。

```js
var a = [];
for (let i = 0; i < 10; i++) {
  let i = 'a'
  console.log(i); // a
}
```

上面代码正确运行，输出了 10 次abc。这表明函数内部的变量i与循环变量i不在同一个作用域，有各自单独的作用域。

## 二、作用域链

### 1. 什么是自由变量

当前作用域没有声明的变量，就是自由变量，比如下面的示例：

```js
var a = 100
function fn() {
    var b = 200
    console.log(a) // 这里的a在这里就是一个自由变量
    console.log(b)
}
fn()
```

### 2. 什么是作用域链

那么自由变量的值如何找到：向创建它的父级作用域查找（如果只说父级作用域的话不严谨，下面会详细解释）。那如果父级作用域也没有呢，就一层一层的向上寻找，直到找到全局作用域。这一层一层的关系，就是作用域链。

> 注：还有一种说法是：当查找变量的时候，会先从当前上下文的变量对象中查找，如果没有找到，就会从父级执行上下文中查找，一直找到全局上下文的变量对象。这样由多个执行上下文的变量对象构成的链表就叫做作用域链。

关于自由变量的值，上文提到要到父作用域中取，其实有时候这种解释会产生歧义。

```js
var x = 10
function fn() {
  console.log(x)
}
function show(f) {
  var x = 20
  (function() {
    f() //10，而不是20
  })()
}
show(fn)
```
在fn函数中，要`取自由变量x的值`时，需要到`创建`fn的作用域中取，而`不是调用`它的

