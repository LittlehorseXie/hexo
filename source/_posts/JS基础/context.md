---
title: 执行上下文
category: JS基础
date: 2020-08-31 18:40
top: 99
---

## 一、什么是执行上下文

我们先看几段代码

**1. 变量声明提升**

```js
console.log(a) // Uncaught ReferenceError: a is not defined

console.log(b) // undefined
var b

console.log(c) // undefined
var c = 10
```
第一句报错，a未定义，很正常。第二句、第三句输出都是undefined，说明浏览器在执行console.log(c)时，已经知道了c是undefined，但却不知道c是10

**2. this获取**

比如我们在代码的任何位置输出this，都是有值的

**3. 函数**
```js
console.log(f1) // function f1() {}
function f1() {} // 函数声明

console.log(f2) // undefined
var f2 = () => {} // 函数表达式

console.log(f3) // undefined
var f3 = function() {} // 函数表达式
```

看以上代码。“函数声明”时我们看到了第二种情况的影子，而“函数表达式”时我们看到了第一种情况的影子


这说明，在一段js代码拿过来真正一句一句执行之前，浏览器已经做了一些`“准备工作”`

我们总结一下，在“准备工作”中完成了哪些工作：

- 变量、函数表达式——变量声明，默认赋值为undefined；
- this——赋值；
- 函数声明——赋值；

这三种数据的准备情况我们称之为“执行上下文”或者“执行上下文环境”。

javascript在执行一个代码段之前，都会进行这些“准备工作”来生成执行上下文。这个“代码段”其实分三种情况——全局代码，函数体，eval代码。

> 这里解释一下为什么代码段分为这三种。
> 所谓“代码段”就是一段文本形式的代码。
> 首先，全局代码是一种，这个应该没有非议，本来就是手写文本到<script>标签里面的。
> 其次，eval代码接收的也是一段文本形式的代码。 eval('alert(1)')
> 最后，函数体是代码段是因为函数在创建时，本质上是 new Function(…) 得来的，其中需要传入一个文本形式的参数作为函数体。var fn1 = new Function('x', 'console.log(x+1)')

`函数每被调用一次，都会产生一个新的执行上下文环境`。因为不同的调用可能就会有不同的参数。

**全局代码的上下文环境数据内容为：**

普通变量（包括函数表达式），如 var a = 10    声明（默认赋值为undefined）
函数声明，如： function fn() { }          赋值
this                                    赋值

**如果代码段是函数体，那么在此基础上需要附加：**
参数                赋值
arguments          赋值
自由变量的取值作用域  赋值

给执行上下文环境下一个通俗的定义——`在执行代码之前，把将要用到的所有的变量都事先拿出来，有的直接赋值了，有的先用undefined占个空`。


## 执行上下文栈

讲完了上下文环境，又来了新的问题——在执行js代码时，会有数不清的函数调用次数，会产生许多个上下文环境。这么多上下文环境该如何管理，以及如何销毁而释放内存呢？

执行全局代码时，会产生一个执行上下文环境，每次调用函数都又会产生执行上下文环境。当函数调用完成时，这个上下文环境以及其中的数据都会被消除，再重新回到全局上下文环境。`处于活动状态的执行上下文环境只有一个`。

其实这是一个`压栈出栈的过程`——执行上下文栈。










这里用一个例子来讲解执行上下文栈的执行过程：

```js
var scope = 'global scope';

function checkscope(s) {
  var scope = 'local scope';

  function f() {
    return scope;
  }
  return f();
}
checkscope('scope');
```

当JS引擎解析代码的时候，最先碰到的就是`global scope`，所以一开始就会将全局上下文推入执行上下文栈

这里我们用ECS来模拟执行上下文栈，用globalContext来表示全局上下文：

```js
ESC = [
  globalContext // 一开始只有全局上下文
]
```

当代码执行到checkscope的时候，会创建`checkscope函数`执行上下文，并压入执行上下文栈：

```js
ESC = [
  checkscopeContext, // 入栈
  globalContext
]
```

当代码执行到return f()时，f函数的执行上下文会被创建：

```js
ESC = [
  fContext,
  checkscopeContext,
  globalContext
]
```

f函数执行完毕后，f函数的执行上下文出栈，随后checkscope函数执行完毕，checkscope函数的执行上下文出栈

## 变量对象

每一个执行上下文都有三个重要的属性：

- 变量对象
- 作用域链
- this

### 全局上下文中的变量对象

全局上下文中的变量对象其实就是全局对象，我们可以通过this来访问全局对象
在浏览器环境中 this === window，在node环境中 this === global

### 函数上下文中的变量对象

在函数执行之前，会为当前函数创建执行上下文，并且在此时，会创建变量对象：

- 根据函数arguments属性初始化argumennts对象
- 根据函数声明生成对应的属性，其值为一个指向内存中函数的引用指针。如果函数名称已存在，则覆盖
- 根据变量声明生成对应的属性，此时初始值为undifined。如果变量名已声明，则忽略该变量声明

已刚刚的代码为例：
在执行checkscope函数之前，会为其创建执行上下文，并初始化变量对象，此时的变量对象为：
```js
VO = {
  arguments: {
    0: 'scope',
    length: 1,
  },
  s: 'scope', // 传入的参数
  f: pointer to function f(),
  scope: undefined, // 此时声明的变量为undefined
}
```
随着checkscope函数的执行，变量对象被激活，变相对象内的属性随着代码的执行而改变：
```js
VO = {
  arguments: {
    0: 'scope',
    length: 1,
  },
  s: 'scope', // 传入的参数
  f: pointer to function f(),
  scope: 'local scope', // 变量赋值
}
```

其实也可以用另一个概念“函数提升”和“变量提升”来解释

## 作用域链

之前第二部分我们按照作用域的说法描述了作用域链，在这里我们按照另一种说法 -- 执行上下文举例说一下作用域链

### 例子1

```js
var scope = 'global scope';

function checkscope(s) {
  var scope = 'local scope';

  function f() {
    return scope;
  }
  return f();
}
checkscope('scope'); // 'local scope'
```
首先在checkscope函数声明的时候，内部会绑定一个[[scope]]的内部属性：
```js
checkscope.[[scope]] = [
  globalContext.VO
];
```
接着在checkscope函数执行之前，创建执行上下文checkscopeContext，并推入执行上下文栈：

复制函数的[[scope]]属性初始化作用域链；
创建变量对象；
将变量对象压入作用域链的最顶端；

```js
checkscopeContext = {
  scope: [VO, checkscope.[[scope]]],
  VO = {
    arguments: {
      0: 'scope',
      length: 1,
    },
    s: 'scope', // 传入的参数
    f: pointer to function f(),
    scope: undefined, // 此时声明的变量为undefined
  },
}
```
接着，随着函数的执行，修改变量对象：
```js
checkscopeContext = {
  scope: [VO, checkscope.[[scope]]],
  VO = {
    ...
    scope: 'local scope', // 此时声明的变量为undefined
  },
}
```
### 例子2
```js
var scope = 'global scope';

function f() {
  console.log(scope)
}

function checkscope() {
  var scope = 'local scope';

  f();
}
checkscope(); // 'global scope'
```

首先遇到了f函数的声明，此时为其绑定[[scope]]属性：
```js
f.[[scope]] = [
  globalContext.VO, // 此时的全局上下文的变量对象中保存着scope = 'global scope';
];
```
然后我们直接跳过checkscope的执行上下文的创建和执行的过程，直接来到f函数的执行上。此时在函数执行之前初始化f函数的执行上下文：
```js
fContext = {
  scope: [VO, globalContext.VO], // 复制f.[[scope]]，f.[[scope]]只有全局执行上下文的变量对象
  VO = {
    arguments: {
      length: 0,
    },
  },
}
```
然后到了f函数执行的过程，console.log(scope)，会沿着f函数的作用域链查找scope变量，先是去自己执行上下文的变量对象中查找，没有找到，然后去global执行上下文的变量对象上查找，此时scope的值为global scope。




## 执行上下文和作用域的区别

许多开发人员经常混淆作用域和执行上下文的概念，误以为他们是相同的概念，但并非如此

我们知道javascript属于解释性语言，javascript的执行分为：解释和执行两个阶段，这两个阶段所做的事是不一样的

**解释阶段：**
- 词法分析
- 语法分析
- 作用域规则确定

**执行阶段**
- 创建执行上下文（也可以理解为执行前的“准备工作”）
- 执行函数代码
- 垃圾回收

js解释阶段便会确定解释规则，因此作用域在函数定义时就已经确定了，而不是在函数调用时确定，但是执行上下文是在函数执行之前创建的
执行上下文最明显的就是this的指向是执行时确定的，而作用域访问的变量是编写代码的结构确定的

作用域和执行上下文之间最大的区别是：执行上下文在运行时确定，随时都可能改变；作用域在定义时确定，不会改变

一个作用域下可能包含若干个上下文环境；也有可能从来没有上下文环境（函数未被调用执行）；也有可能有过，但是函数执行后，上下文环境被销毁了

同一作用域下，不同的调用会产生不同的执行上下文环境，那么随着我们的执行上下文数量的增加，JS引擎又如何去管理这些执行上下文呢？这时便有了执行上下文栈。
