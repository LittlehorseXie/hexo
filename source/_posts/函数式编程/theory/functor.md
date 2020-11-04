---
title: 函子、容器、流
category: 函数式编程
date: 2020-11-04
top: 96
---

我们先回顾一下普通函子：
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

接下来介绍各种常见的函子

## Maybe 函子

Maybe 函子是指在 map 方法中增加了对空值的判断的函子。

由于函子中的 map 方法中的函数参数会对函子内部的值进行处理，所以当传入函子中的值为空（如 null）时，则可能会产生错误。

```js
function toUpperCase(str) {
    return str.toUpperCase();
}

console.log(Functor.of(null).map(toUpperCase));  // TypeError
```

Maybe 函子则在 map 方法中增加了对空值的判断，若是函子内部的值为空，则直接返回一个内部值为空的函子。

```js
function Maybe(val){
    this.val = val;
}
Maybe.prototype.map = function(f){
    return this.val ? Maybe.of(f(this.val)) : Maybe.of(null);
}
Maybe.of = function(val) {
    return new Maybe(val);
}

console.log(Maybe.of(null).map(toUpperCase));  // Maybe { val: null }
```

## Either 函子

Either 函子是指内部有分别有左值（left）和右值（right），正常情况下会使用右值，而当右值不存在的时候会使用左值的函子。

如下当左右值都存在的时候则以右值为函子的默认值，当右值不存在是则以左值为函子的默认值。

```js
function addOne(x) {
    return x+1;
}

console.log(Either.of(1,2).map(addOne));  // Either { left: 1, right: 3 }
console.log(Either.of(3,null).map(addOne));  // Either { left: 4, right: null }
```

Either实现如下：

```js
function Either(left, right) {
  this.left = left
  this.right = righ
}
Either.prototype.map = function (f) {
  return this.right ? Either.of(this.left, f(this.right)) : Either.of(f(this.left), this.right)
}
Either.of = function(left, right) {
  return new Either(left, right);
}
```

## Monad 函子

Monad 函子是指能够将函子多层嵌套解除的函子。

我们往函子传入的值不仅仅可以是普通的数据类型，也可以是其它函子，当往函子内部传其它函子的时候，则会出现函子的多层嵌套。如下

```js
var functor = Functor.of(Functor.of(Functor.of('ttsy')))

console.log(functor);  // Functor { val: Functor { val: Functor { val: 'ttsy' } } }
console.log(functor.val);  // Functor { val: Functor { val: 'ttsy' } }
console.log(functor.val.val);  // Functor { val: 'ttsy' }
```

Monad 函子中新增了 join 和 flatMap 方法，通过 flatMap 我们能够在每一次传入函子的时候都将嵌套解除。

```js
Monad.prototype.map=function(f){
    return Monad.of(f(this.val))
}
Monad.prototype.join=function(){
    return this.val;
}
Monad.prototype.flatMap=function(f){
    return this.map(f).join();
}
Monad.of = function(val) {
    return new Monad(val);
}
```

通过 Monad 函子，我们最终得到的都是只有一层的函子。
```js
console.log(Monad.of('ttsy').flatMap(Monad.of).flatMap(Monad.of));  // Monad { val: 'TTSY' }
```


