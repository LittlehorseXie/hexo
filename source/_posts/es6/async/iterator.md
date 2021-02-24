---
title: Iterator遍历器 和 for...of循环
category: es6
date: 2020-12-19
top: 95
---

Iterator对象是一个指针对象，实现类似于单项链表的数据结构，通过next()将指针指向下一个节点

Iterator 的遍历过程是这样的。

（1）创建一个指针对象，指向当前数据结构的起始位置。也就是说，遍历器对象本质上，就是一个指针对象。

（2）第一次调用指针对象的next方法，可以将指针指向数据结构的第一个成员。

（3）第二次调用指针对象的next方法，指针就指向数据结构的第二个成员。

（4）不断调用指针对象的next方法，直到它指向数据结构的结束位置。

每一次调用next方法，都会返回数据结构的当前成员的信息。具体来说，就是返回一个包含value和done两个属性的对象。其中，value属性是当前成员的值，done属性是一个布尔值，表示遍历是否结束。

下面是一个模拟next方法返回值的例子。

```js
var it = makeIterator(['a', 'b']);

it.next() // { value: "a", done: false }
it.next() // { value: "b", done: false }
it.next() // { value: undefined, done: true }

function makeIterator(array) {
  var nextIndex = 0;
  return {
    next: function() {
      return nextIndex < array.length ?
        {value: array[nextIndex++], done: false} :
        {value: undefined, done: true};
    }
  };
}
```

Iterator 接口的目的，就是为所有数据结构，提供了一种统一的访问机制，即`for...of`循环。当使用for...of循环遍历某种数据结构时，该循环会自动去寻找 Iterator 接口。

## Symbol.iterator

一种数据结构只要部署了 Iterator 接口，我们就称这种数据结构是“`可遍历的`”（iterable）

ES6 规定，默认的 Iterator 接口部署在数据结构的`Symbol.iterator`属性，或者说，一个数据结构只要具有Symbol.iterator属性，就可以认为是“可遍历的”（iterable）。Symbol.iterator属性本身是一个函数，就是当前数据结构默认的遍历器生成函数。执行这个函数，就会返回一个遍历器。至于属性名Symbol.iterator，它是一个表达式，返回Symbol对象的iterator属性，这是一个预定义好的、类型为 Symbol 的特殊值，所以要放在方括号内

```js
const obj = {
  [Symbol.iterator] : function () {
    return {
      next: function () {
        return {
          value: 1,
          done: true
        };
      }
    };
  }
};
for(let i of obj) { console.log(i)} // undefined

const obj1 = {
  [Symbol.iterator] : function () {
    return {
      next: function () {
        return {
          value: 1,
          done: false
        };
      }
    };
  }
};
for(let i of obj1) { console.log(i)} // 输出无数个1 死循环

const obj2 = {}
for(let i of obj2) { console.log(i)} // Uncaught TypeError: obj2 is not iterable
```

我们也可以通过Symbol.iterator属性获取一个Iterator对象
```js
const arr = [100, 200, 300]
const iterator = arr[Symbol.iterator]()

console.log(iterator.next())  // { value: 100, done: false }
console.log(iterator.next())  // { value: 200, done: false }
console.log(iterator.next())  // { value: 300, done: false }
console.log(iterator.next())  // { value: undefined, done: true }
```


ES6 的有些数据结构原生具备 Iterator 接口（比如数组），即不用任何处理，就可以被for...of循环遍历。原因在于，这些数据结构原生部署了Symbol.iterator属性（详见下文），另外一些数据结构没有（比如对象）。凡是部署了Symbol.iterator属性的数据结构，就称为部署了遍历器接口。调用这个接口，就会返回一个遍历器对象。

## 原生具备 Iterator 接口的数据结构

Array
Map
Set
String
TypedArray
函数的 arguments 对象
NodeList 对象

下面的例子是数组的Symbol.iterator属性。

```js
let arr = ['a', 'b', 'c'];
let iter = arr[Symbol.iterator]();

iter.next() // { value: 'a', done: false }
iter.next() // { value: 'b', done: false }
iter.next() // { value: 'c', done: false }
iter.next() // { value: undefined, done: true }
```

## 调用 Iterator 接口的场合 

### （1）解构赋值

对数组和 Set 结构进行解构赋值时，会默认调用Symbol.iterator方法。
```js
let set = new Set().add('a').add('b').add('c');

let [x,y] = set;
// x='a'; y='b'

let [first, ...rest] = set;
// first='a'; rest=['b','c'];
```

### （2）扩展运算符

扩展运算符（...）也会调用默认的 Iterator 接口。
```js
let myIterable = {
  [Symbol.iterator]: function* () {
    yield 1;
    yield 2;
    yield 3;
  }
};
[...myIterable] // [1, 2, 3]

// 或者采用下面的简洁写法

let obj = {
  * [Symbol.iterator]() {
    yield 'hello';
    yield 'world';
  }
};

```

### （3）yield*

```js
yield*后面跟的是一个可遍历的结构，它会调用该结构的遍历器接口。

let generator = function* () {
  yield 1;
  yield* [2,3,4];
  yield 5;
};

var iterator = generator();

iterator.next() // { value: 1, done: false }
iterator.next() // { value: 2, done: false }
iterator.next() // { value: 3, done: false }
iterator.next() // { value: 4, done: false }
iterator.next() // { value: 5, done: false }
iterator.next() // { value: undefined, done: true }
```

### （4）其他场合

由于数组的遍历会调用遍历器接口，所以任何接受数组作为参数的场合，其实都调用了遍历器接口。下面是一些例子。

- for...of
- Array.from()
- Map(), Set(), WeakMap(), WeakSet()（比如new Map([['a',1],['b',2]])）
- Promise.all()
- Promise.race()

## 遍历器对象的 return()，throw()

遍历器对象除了具有next()方法，还可以具有`return()`方法和`throw()`方法。如果你自己写遍历器对象生成函数，那么next()方法是必须部署的，return()方法和throw()方法是否部署是可选的。

return()方法的使用场合是，如果for...of循环提前退出（通常是因为出错，或者有break语句），就会调用return()方法。如果一个对象在完成遍历前，需要清理或释放资源，就可以部署return()方法。

```js
function readLinesSync(file) {
  return {
    [Symbol.iterator]() {
      return {
        next() {
          return { done: false };
        },
        return() {
          file.close();
          return { done: true };
        }
      };
    },
  };
}
```

上面代码中，函数readLinesSync接受一个文件对象作为参数，返回一个遍历器对象，其中除了next()方法，还部署了return()方法。下面的两种情况，都会触发执行return()方法。

```js
// 情况一
for (let line of readLinesSync(fileName)) {
  console.log(line);
  break;
}

// 情况二
for (let line of readLinesSync(fileName)) {
  console.log(line);
  throw new Error();
}
```

注意，return()方法必须返回一个对象，这是 Generator 语法决定的。

throw()方法主要是配合 Generator 函数使用，一般的遍历器对象用不到这个方法。

## for...of

`for...of`循环本质上就是调用这个接口产生的遍历器，可以用下面的代码证明

```js
const arr = ['red', 'green', 'blue'];

for(let v of arr) {
  console.log(v); // red green blue
}

const obj = {};
obj[Symbol.iterator] = arr[Symbol.iterator].bind(arr);

for(let v of obj) {
  console.log(v); // red green blue
}
```
上面代码中，空对象obj部署了数组arr的Symbol.iterator属性，结果obj的for...of循环，产生了与arr完全一样的结果。

## for...of for...in 的区别

for...of不能遍历普通对象

for...in循环，只能获得对象的键名，不能直接获取键值。ES6 提供for...of循环，允许遍历获得键值。
```js
var arr = ['a', 'b', 'c', 'd'];

for (let a in arr) {
  console.log(a); // 0 1 2 3
}

for (let a of arr) {
  console.log(a); // a b c d
}
```

for...of循环调用遍历器接口，数组的遍历器接口只返回具有数字索引的属性。这一点跟for...in循环也不一样。
```js
let arr = [3, 5, 7];
arr.foo = 'hello';

for (let i in arr) {
  console.log(i); // "0", "1", "2", "foo"
}

for (let i of arr) {
  console.log(i); //  "3", "5", "7"
}
```

## 与其他遍历语法的比较 

以数组为例，JavaScript 提供多种遍历语法。最原始的写法就是`for循环`。

```js
for (var index = 0; index < myArray.length; index++) {
  console.log(myArray[index]);
}
```

这种写法比较麻烦，因此数组提供内置的`forEach`方法。

```js
myArray.forEach(function (value) {
  console.log(value);
});
```

这种写法的问题在于，`无法中途跳出`forEach循环，break命令或return命令都不能奏效。

`for...in`循环可以遍历数组的键名。

```js
for (var index in myArray) {
  console.log(myArray[index]);
}
```

for...in循环有几个缺点。

- 数组的键名是数字，但是for...in循环是以字符串作为键名“0”、“1”、“2”等等。
- for...in循环不仅遍历数字键名，还会遍历手动添加的其他键，甚至包括原型链上的键。
- 某些情况下，for...in循环会以任意顺序遍历键名。

总之，**for...in循环主要是为遍历对象而设计的，不适用于遍历数组**。

`for...of`循环相比上面几种做法，有一些显著的优点。

- 有着同for...in一样的简洁语法，但是没有for...in那些缺点。
- 不同于forEach方法，它可以与break、continue和return配合使用。
- 提供了遍历所有数据结构的统一操作接口。
