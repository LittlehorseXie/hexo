---
title: 其他主流编程范式
category: 函数式编程
date: 2020-11-04
top: 93
---

面向过程编程
面向对象编程
元编程
命令式编程
声明式编程


## 命令式模式 VS 声明式模式

- 命令式模式侧重于描述程序如何运行（怎么做），它由程序执行的命令组成；
- 声明式模式侧重于描述程序要达成什么效果（做什么），并没有指定程序应该如何实现。

```js
var books = [
  {name:'JavaScript', pages:450}, 
  {name:'Angular', pages:902},
  {name:'Node', pages:732}
];
/* 命令式编程 */
for (var i = 0; i < books.length; i++) {
  books[i].lastRead =  new Date();
}
/* 声明式编程 */
books.map((book)=> {
  book.lastReadBy = 'me';
  return book;
});
console.log(books);
```

- 在上面的代码片段中，我使用两种不同的方式给Books里面的每一个对象新增属性：lastReadBy；
- 第一种方式使用了for循环，通过数组下标为每一个元素新增属性。因此，这种程序的焦点在于如何操作以达到期望的输出；
- 第二种方式使用了原生JavaScript里数组的map()方法，这个方法接收一个函数作为参数并对容器中的每一个元素执行调用。这种代码描述的是要做什么而不是怎么做，实际的操作则由map()负责。


