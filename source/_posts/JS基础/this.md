---
title: this
category: JS基础
date: 2020-03-25 14:29
top: 96
---

首先，我们明确一个原则：`this 永远指向最后调用它的那个对象`。在函数中this到底取何值，是在函数真正被调用执行的时候确定的，函数定义的时候确定不了。因为this的取值是执行上下文环境的一部分，每次调用函数，都会产生一个新的执行上下文环境。

我们看下面的几段代码：

```javascript
var name = "windowsName";
var a = {
  name: "Cherry",
  fn : function () {
    console.log(this.name);      // Cherry
  }
}
a.fn();
```
```javascript
var name = "windowsName";
var a = {
  // name: "Cherry",
  fn : function () {
    console.log(this.name);      // undefined
  }
}
window.a.fn();
```
```javascript
var name = "windowsName";
var a = {
  name: "Cherry",
  fn : function () {
    console.log(this.name);      // windowsName
  }
}

var f = a.fn;
f();
```
```javascript
var name = "windowsName";

function fn() {
  var name = 'Cherry';
  innerFunction();
  function innerFunction() {
    console.log(this.name);      // windowsName
  }
}

fn()
```

然后，我们再看一段代码，想象一下浏览器会输出什么：
```javascript
var name = "windowsName";

var a = {
  name: "Cherry",
  func1: function () {
    console.log(this.name)     
  },
  func2: function () {
    setTimeout(function () {
      this.func1()
    }, 100);
  }
};

a.func2()
```
理想情况下，我们是希望输出 Cherry 的，但是事实上，在不使用箭头函数的情况下，是会报错的，因为最后调用 setTimeout 的对象是 window，但是在 window 中并没有 func1 函数。

为了解决这个问题，我们有以下几种方法：

## 改变 this 指向

### 1. 箭头函数

众所周知，ES6 的箭头函数是可以避免 ES5 中使用 this 的坑的。箭头函数的 this 始终指向函数定义时的 this，而非执行时。

```javascript
var name = "windowsName";

var a = {
  name : "Cherry",
  func1: function () {
    console.log(this.name)     
  },
  func2: function () {
    setTimeout( () => {
      this.func1()
    }, 100);
  }
};

a.func2()     // Cherry
```

### 2. 在函数内部使用 _this = this

```javascript
var name = "windowsName";

var a = {
  name : "Cherry",
  func1: function () {
    console.log(this.name)     
  },
  func2: function () {
    var _this = this;
    setTimeout( function() {
      _this.func1()
    }, 100);
  }
};

a.func2()       // Cherry
```

### 3. 使用apply
```javascript
var a = {
  name : "Cherry",
  func1: function () {
    console.log(this.name)
  },
  func2: function () {
    setTimeout(  function () {
      this.func1()
    }.apply(a), 100);
  }
};

a.func2()            // Cherry
```

### 4. 使用call
```javascript
var a = {
  name : "Cherry",
  func1: function () {
    console.log(this.name)
  },
  func2: function () {
    setTimeout(  function () {
      this.func1()
    }.call(a), 100);
  }
};

a.func2()            // Cherry
```

### 5. 使用bind
```javascript
var a = {
  name : "Cherry",
  func1: function () {
    console.log(this.name)
  },
  func2: function () {
    setTimeout(  function () {
      this.func1()
    }.bind(a)(), 100);
  }
};

a.func2()            // Cherry
```

`注：后三种方法，虽然可以改变this指向，但是会立即执行，导致setTimeout失效`

## apply、call、bind 区别

> fun.apply(thisArg, [argsArray])

- thisArg：在 fun 函数运行时指定的 this 值。需要注意的是，指定的 this 值并不一定是该函数执行时真正的 this 值，如果这个函数处于非严格模式下，则指定为 null 或 undefined 时会自动指向全局对象（浏览器中就是window对象），同时值为原始值（数字，字符串，布尔值）的 this 会指向该原始值的自动包装对象。
- argsArray：一个数组或者类数组对象，其中的数组元素将作为单独的参数传给 fun 函数。如果该参数的值为null 或 undefined，则表示不需要传入任何参数。从ECMAScript 5 开始可以使用类数组对象。

> fun.call(thisArg[, arg1[, arg2[, ...]]])

apply 和 call 的区别是 call 方法接受的是若干个参数列表，而 apply 接收的是一个包含多个参数的数组。

> bind()方法创建一个新的函数, 当被调用时，将其this关键字设置为提供的值，在调用新函数时，在任何提供之前提供一个给定的参数序列。

bind 是创建一个新的函数，我们必须要手动去调用

## JS 中的函数调用

### 1. 作为一个函数调用

```javascript
var name = "windowsName";
function a() {
  var name = "Cherry";
  console.log(this.name);          // windowsName
  console.log("inner:" + this);    // inner: Window
}
a();
console.log("outer:" + this)         // outer: Window
```
这样一个最简单的函数，不属于任何一个对象，就是一个函数，这样的情况在 JavaScript 的在浏览器中的非严格模式默认是属于全局对象 window 的，在严格模式，就是 undefined。 
但这是一个全局的函数，很容易产生命名冲突，所以不建议这样使用。


### 2. 函数作为方法调用

```javascript
var name = "windowsName";
var a = {
  name: "Cherry",
  fn : function () {
    console.log(this.name);      // Cherry
  }
}
a.fn();
```

### 3. 使用构造函数调用函数
> 如果函数调用前使用了 new 关键字, 则是调用了构造函数。
> 这看起来就像创建了新的函数，但实际上 JavaScript 函数是重新创建的对象：

```javascript
// 构造函数:
function myFunction(arg1, arg2) {
  this.firstName = arg1;
  this.lastName  = arg2;
}

// This    creates a new object
var a = new myFunction("Li","Cherry");
a.lastName;                             // 返回 "Cherry"
```

### 4. 作为函数方法调用函数（call、apply）
```javascript
var name = "windowsName";

function fn() {
  var name = 'Cherry';
  innerFunction();
  function innerFunction() {
    console.log(this.name);      // windowsName
  }
}

fn()
```
这里的 innerFunction() 的调用是不是属于第一种调用方式：作为一个函数调用（它就是作为一个函数调用的，没有挂载在任何对象上，所以对于没有挂载在任何对象上的函数，在非严格模式下 this 就是指向 window 的）
