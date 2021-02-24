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
> 首先，全局代码是一种，这个应该没有非议，本来就是手写文本到 script标签里面的。
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


## 二、执行上下文栈

讲完了上下文环境，又来了新的问题——在执行js代码时，会有数不清的函数调用次数，会产生许多个上下文环境。这么多上下文环境该如何管理，以及如何销毁而释放内存呢？

执行全局代码时，会产生一个执行上下文环境，每次调用函数都又会产生执行上下文环境。当函数调用完成时，这个上下文环境以及其中的数据都会被消除，再重新回到全局上下文环境。`处于活动状态的执行上下文环境只有一个`。

其实这是一个`压栈出栈的过程`——执行上下文栈。

![](../../assets/JS基础/context-stack.png)

### 1 🌰

下面我们根据一个例子来详细介绍上下文栈的压栈、出栈过程：

```js
var a = 10, // 1. 进入全局上下文环境
    fn,
    bar = function (x) {
      var b = 5;
      fn(x+b) // 3. 进入fn函数上下文环境
    }
fn = function(y) {
  var c = 5
  console.log(y+c)
}
bar(10) // 2. 进入bar函数上下文环境
```

**1. 在执行代码之前，先创建`全局上下文环境`**

全局上下文环境
a undefined
fn undefined
bar undefined
this window 

全局上下文中的变量对象其实就是全局对象，我们可以通过this来访问全局对象
在浏览器环境中 this === window，在node环境中 this === global

**2. 然后执行代码，在代码执行到最后一行之前，上下文环境中的变量都在`执行过程中被赋值`**

全局上下文环境
a 10
fn function
bar function
this window

**3. 执行到最后一行时，调用bar函数，跳转到bar函数内部，执行函数语句之前，会创建一个新的执行上下文环境**

bar函数-执行上下文环境
b undefined
x 10
arguments [10]
this window

并将这个执行上下文环境压栈，设置为活动状态。

![](../../assets/JS基础/context-stack1.png)

**4. 执行到第5行，又调用了fn函数。进入fn函数，在执行函数体语句之前，会创建fn函数的执行上下文环境，并压栈，设置为活动状态。**

![](../../assets/JS基础/context-stack2.png)

**5. 待第5行执行完毕，即fn函数执行完毕后，此次调用fn所生成的上下文环境出栈，并且被销毁（已经用完了，就要及时销毁，释放内存）。**

![](../../assets/JS基础/context-stack3.png)

**6. 同理，待第13行执行完毕，即bar函数执行完毕后，调用bar函数所生成的上下文环境出栈，并且被销毁（已经用完了，就要及时销毁，释放内存）。**

![](../../assets/JS基础/context-stack4.png)

讲到这里，我不得不很遗憾的跟大家说：其实以上我们所演示的是一种比较理想的情况。有一种情况，而且是很常用的一种情况，无法做到这样干净利落的说销毁就销毁。这种情况就是伟大的——`闭包`。


### 2 🌰

再用一个例子来讲解执行上下文栈的执行过程：

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

**1. 执行代码之前，先创建全局上下文**

全局上下文
scope undefined
checkscope function

**2. 执行到最后一行之前，变量赋值**

全局上下文
scope 'global scope'
checkscope function

**3. 执行到最后一行时，调用checkscope函数，跳转到checkscope函数内部，执行函数语句之前，会创建一个新的执行上下文环境**

checkscope函数-上下文环境
s 'scope'
scope undefined // `变量提升`
f function // `函数提升`
arguments ['scope']

**4. 执行checkscope函数，变量赋值**

checkscope函数-上下文环境
s 'scope'
scope 'local scope'
f function
arguments ['scope']

**5. 将要执行f函数**
f函数-上下文环境
scope undefined

**6. 执行f函数，向上查找scope**
输出local scope

**7. 执行完后，逐步销毁上下文**

### 3 🌰

将上面的🌰改动一下

```js
var scope = 'global scope';
function f() {
  return scope;
}

function checkscope(s) {
  var scope = 'local scope';
  return f();
}
checkscope('scope');
```

**1. 执行代码之前，先创建全局上下文**

全局上下文
scope undefined
f function
checkscope function

**2. 执行到最后一行之前，变量赋值**

全局上下文
scope 'global scope'
f function // 这时已经有f了 当f执行的时候，就先找f函数上下文的scope，没找到，再向上找到'global scope'
checkscope function



