---
title: 什么是函数式编程？
category: 函数式编程
date: 2020-11-03
top: 99
---

**函数式编程（Function Programing，通常简称FP），是一种编程范式**
**把计算看作是对数学函数的求值，通过组合纯函数（Pure functions）来构建软件**
**避免共享状态（shared state）、数据可变（mutable date）和副作用（side-effects）**

函数式编程是声明式而非命令式的，应用程序的状态通过纯函数流动。

> 上边提到的这些名词现在不理解没关系，下面都会讲到

函数式编程是一种编程范式，这意味着 **它是基于一些基本的、特定的原则（上面列出的——去思考软件构件的方法论**。另外其他的编程范式还包括面向对象和面向过程编程。




面向对象编程关注的是数据，**函数式编程关注的则是动作**，它是一种过程抽象的思维，就是对当前的动作去进行抽象

## 函数式编程的优势

>- 纯函数特性保证了其作用域之外的变量不会被更改
>- 更简洁、更可预测、更易理解、可读性更强
>- 降低了复杂性，我们只需要关注程序要做什么而不是怎么做
>- 代码更易测试，结果更易验证，因为它不依赖程序的状态



比如说我要计算一个数 加上4再乘以4的值，按照正常写代码的逻辑，我们一般会这样实现：
```js
function calculate(x) {
  return (x + 4) * 4
}
console.log(calculate(1)) // 20
```

这样操作是没有任何问题的，我们平时在开发的过程中会经常将需要重复的操作封装成函数，以便在不同的地方能够调用。但从函数式编程的思维来看的话，我们关注的则是这一系列操作的动作，先[加上4]再[乘以4]

如何封装函数才是最佳实践呢？如何封装才能使函数更加通用，使用起来让人感觉更加舒服呢？

## 函数式编程的两个基本特征

### 函数是一等公民

第一等公民是指函数跟其他的数据类型一样处于平等地位，**可以赋值给其他变量，可以做为参数传入给另一个函数，也可以作为别的函数的返回值**

```js
// 赋值
const a = functionn f1() {}
// 传参
function f2(fn) {
  fn()
}
// 返回
function f3() {
  return function() {}
}
```

### 函数是纯函数

纯函数有两个特点：
- 相同的输入总会得到相同的输出
- 无副作用

无副作用是指函数内部的操作不会对外部产生影响（如 修改全局变量的值、修改dom节点等）

```js
// 是纯函数
function add (x, y) {
  return x + y
}
// 输出不确定，不是
function random(x) {
  return Math.random() * x
}
// 有副作用，不是
function setColor(el, color) {
  el.style.color = color
}
// 输出不确定，有副作用，不是
let count = 0
function addCount(x) {
  count+=x
  return count
}
```

## 函数式编程的两个基本运算

### 函数合成（compose）

函数合成是指将代表多个动作的多个函数合并成一个函数

上面讲到，函数式编程是对过程的抽象，关注的是动作。以上面的计算为例，我们关注的动作：先[加上4]再[乘以4]。那么，我们的代码可以实现如下：

```js
function add4(x) {
  return x + 4
}
function multiply4(x) {
  return x * 4
}
console.log(multiply4(add4(1)))
```

根据函数合成的定义，我们能够将上述代表两个动作的两个函数合成一个函数。我们将合成的动作再抽象成一个函数-compose，以实现这样的效果：compose(multiply4, add4)(1)

```js
function compose(f, g) {
  return function(x) {
    return f(g(x))
  }
}
```
可以看到，只要往 compose 函数中传入代表各个动作的函数，我们便能得到最终的合成函数。但上述 compose 函数的局限性是只能够合成两个函数，我们可以扩展一下，不限制参数数量

```js
function compose() {
  const funcs = arguments
  const funcsLen = arguments.length
  return function() {
    let start = funcsLen - 1
    let result = funcs[start].apply(this, arguments)
    while(start > 0){
      start --
      result = funcs[start].call(this, result)
    }
    return result
  }
}
```
> 这里有两个需要注意的点
> 1. return 之后使用function，而不是箭头函数，this和argemunts都会有影响
> 2. apply(this, arguments)和call(this, result)

让我们来实践下上面的compose函数
```js
function addHello(str){
    return 'hello '+str;
}
function toUpperCase(str) {
    return str.toUpperCase();
}
function reverse(str){
    return str.split('').reverse().join('');
}

var composeFn=compose(reverse,toUpperCase,addHello);

console.log(composeFn('ttsy'));  // YSTT OLLEH
```

上面的过程有3个动作，[添加hello]、[转换大写]、[反转]，通过compose函数将上述三个动作函数 合并成了一个，最终输出了正确的结果。

### 科里化（Currying）

在维基百科中对科里化的定义是：在计算机科学中，柯里化，又译为卡瑞化或加里化，是 把接受多个参数的函数变为**接受**一个单一参数的函数，**返回** 接受余下的参数而且返回结果的新函数 的技术

柯里化函数则是将函数柯里化之后得到的一个新函数。由上述定义可知，柯里化函数有如下两个特性：

- 接受一个单一参数；
- 返回接受余下的参数而且返回结果的新函数；

```js
function add(a, b) {
  return a + b
}
console.log(add(1, 2)) // 3
```

假设函数add的柯里化函数是 addCurry，那么从上述定义可知，addCurry(1)(2) 应该实现与上述代码相同的效果，输出 3 

```js
function addCurry(a) {
  return function(b) {
    return a + b
  }
}
console.log(addCurry(1)(2))
```

但假设如果有一个函数 createCurry 能够实现柯里化，那么我们便可以通过下述的方式来得出相同的结果

```js
const addCurry = createCurry(add)

console.log(addCurry(1)(2));  // 3
```
可以看到，函数 createCurry 传入一个函数 add 作为参数，返回一个柯里化函数 addCurry，函数 addCurry 能够处理 add 中的剩余参数。这个过程称为函数柯里化，我们称 addCurry 是 add 的柯里化函数。
那么，怎么得到实现柯里化的函数 createCurry 呢？

```js
function createCurry(func, argsTemp) {
  const args = arguments
  const funcLength = func.length
  return function() {
    const argsAll = argsTemp ? argsTemp.concat([...arguments]) : [...arguments]
    // 如果参数个数小于最初的func.length，则递归调用，继续收集参数
    if (argsAll.length < funcLength) {
      return args.callee.call(this, func, argsAll)
    }
    return func.apply(this, argsAll)
  }
}
```
我们可以通过如下方式去随意调用
```js
var addCurry=createCurry(function(a, b, c) {
    return a + b + c;
});

console.log(addCurry(1)(2)(3)); // 6
console.log(addCurry(1, 2, 3)); // 6
console.log(addCurry(1)(2, 3)); // 6
```

## 函子

在前面函数合成的例子中，执行了先「加上 4」再「乘以 4」的动作，我们可以看到代码中是通过 multiply4(add4(1)) 这种形式来实现的，如果通过 compose 函数，则是类似于 compose(multiply4,add4)(1) 这种形式来实现代码。

而在函数式编程的思维中，除了将动作抽象出来外，还希望动作执行的顺序更加清晰，所以对于上面的例子来说，更希望是通过如下的形式来执行我们的动作

```js
fn(1).add4().multiply4()
```

这时我们需要用到函子的概念。

```js
function Functor(val) {
  this.val = val
}
Functor.prototype.map = function(func) {
  return new Functor(func(this.val))
}
```
函子可以简单地理解为有用到 map 方法的数据结构。如上 Functor 的实例就是一个函子。

在函子的 map 方法中接受一个函数参数，然后返回一个新的函子，新的函子中包含的值是被函数参数处理过后返回的值。该方法将函子里面的每一个值，映射到另一个函子。

通过 Functor 函子，我们可以通过如下的方式调用

```js
console.log((new Functor(1)).map(add4).map(multiply4))  // Functor { val: 20 }
```

上述调用的方式是 (new Calculate(1)).map(add4).map(multiply4) ，跟我们想要的效果已经差不多了，但是我们不希望有 new 的存在，所以我们在 Functor 函子挂载上 of 方法

```js
function Functor(val){
    this.val = val;
}
Functor.prototype.map=function(f){
    return new Functor(f(this.val));
}
Functor.of = function(val) {
    return new Functor(val);
}
```
最终我们可以通过如下方式调用

```js
console.log(Functor.of(1).map(add4).map(multiply4))  // Functor { val: 20 }
```


在我们平时的开发过程中，要根据不同的场景去实现不同功能的函数，而函数式编程则让我们从不同的角度去让我们能够以最佳的方式去实现函数功能，但函数式编程不是非此即彼的，而是要根据不同的应用场景去选择不同的实现方式。


到这里，我们已经大概了解函数式编程的基本特征和简单应用了，下面可以再深入了解一下


## 上面提到的一些关键字详细介绍目录

- **[纯函数](../pureFunction/)**
  - 避免数据可变
  - 避免共享状态
  - 避免副作用
- **[纯函数](../pureFunction/)**
- **[函数组合](../compose/)**
- **[函子](../functor/)**

