---
title: 【为什么】要用Immer
category: Redux
date: 2020-10-27
top: 88
---

Immer 是 mobx 的作者写的一个 immutable 库，核心实现是利用 ES6 的 proxy，几乎以最小的成本实现了 js 的不可变数据结构，简单易用、体量小巧、设计巧妙，满足了我们对JS不可变数据结构的需求。

## 数据处理存在的问题

先定义一个 currentState

```js
let currentState = {
  p: {
    x: [2]
  }
}
```

一些情况会不小心修改原对象：

```js
// Q1
let o1 = currentState
o1.p = 1
o1.p.x = 2

// Q2
fn(currentState)
function fn(o) {
  o.p1 = 2
  return o
}

// Q3
let o3 = { ...currentState }
o3.p.x = 2

// Q4
let o4 = currentState
o4.p.x.push(3)
```

## 解决引用类型对象被修改的方法

1. 深拷贝，但深拷贝成本较高，会影响性能
2. ImmutableJS，也是一个不可变数据结构的库，但和 Immer 相比，它有两个不足：
  - 需要使用者学习它的数据结构操作方式，没有 Immer 提供的使用原生对象的操作方式简单、易用
  - 它的操作结果需要使用 toJS 方法才能获取原生对象，这使得在操作一个对象的时候，时刻要注意操作的是原生对象还是 ImmutableJS 的返回结果，稍不注意，就会产生bug

## Immer 功能介绍

我们先看下上面问题使用immer如何解决
```js
import produce from 'immer'

let o1 = produce(currentState, draft => {
  draft.p.x = 2
  draft.p.x.push(3)
})
```

## 概念说明

**currentState**：被操作对象的初始状态
**draftState**：根据 currentState 生成的草稿状态，它是 currentState 的代理，对 draftState 所做的任何操作修改都将被记录用于生成nextState。在此过程中，currentState 不受影响
**nextState**：根据 draftState 生成的最终状态
**produce**：用来生成 nextState 和 producer 的函数
**producer**：通过 producer 生成，用来生产 nextState
**recipe**：用来操作 draftState 的函数

## 常用api

`produce(currentState, recipe: (draftState) => void | draftState, ?PatchListener: (paches: Patch[], inversePatches: Patch[])): nextState`

recipe 没有返回值时，nextState 是通过 recipe 函数内的 draftState 生成的
recipe 有返回值时，nextState 是通过 recipe 函数的返回值生成的
在非箭头函数内，recipe 函数内部的 this 指向 draftState

```js
produce(currentState, function (draft) {
  this === draft // true
})
```

### 使用方法1

```js
let nextState = produce(currentState, (draft) => {
  // 不做任何操作
})

currentState === nextState // true
```

```js
let currentState = {
  a: [],
  p: {
    x: 1
  }
}

let nextState = produce(currentState, (draft) => {
  draft.a.push(2)
})

currentState.a === nextState.a // false
currentState.p === nextState.p // true
currentState === nextState
```

由此可见，对 draftState 的修改都会反应到 nextState 身上，而 immer 使用的结构是共享的，nextState 和 currentState 在结构上共享未修改的部分

### 使用方法2

利用高阶函数的特点，提前生成一个生产者 producer
```js
let producer = produce((draft) => {
  draft.a.push(2)
})

let nextState = producer(currentState)
```


### 自动冻结功能

Immer 还在内部做了一件很巧妙的事，就是通过 produce 生成的 nextState 是被冻结了（Immer 内部使用 Obeject.freeze方法，只冻结 nextState 和 currentState 相比修改的部分），这样修改 nextState 将会报错，这样 nextState 就成了真正的不可变数据

### patch补丁功能

通过此功能，可以方便的进行详细的代码调试和跟踪，可以知道 recipe 内做的每次修改，还可以实现时间旅行

Immer中，一个patch对象是这样的

```js
interface Patch {
  op: 'replace' | 'remove' | 'add', // 更改的操作类型
  path: (string | nunmber)[], // 此属性指 从树根 到被更改树杈的路径
  value?: any // op 为 replace、add 时，才有此属性，表示新赋的值
}
```

举个例子
```js
import produce, { applyPatches } from 'immer'
let state = {
  x: 1
}
let replaces = []
let inverseReplaces = []
state = produce(state, draft => {
  draft.x = 2
  draft.y = 2
}, (patches, inversePatches) => {
  replaces = patches.filter(patch => patch.op === 'replace')
  inverseReplaces = inversePatches.filter(patch => patch.op === 'replace')
})
state = produce(state, draft => {
  draft.x = 3
})
console.log('state1', state) // { x: 3, y: 2 }

state = applyPatches(state, replaces)
console.log('state2', state) // { x: 2, y: 2 }

state = produce(state, draft => {
  draft.x = 4
})
console.log('state3', state) // { x: 4, y: 2 }

state = applyPatches(state, inverseReplaces)
console.log('state4', state) // { x: 1, y: 2 }
```

我们可以先打印 patches 和 inversePatches 看下：
patches 如下：
```js
[{
  op: 'replace',
  path: ['x'],
  value: 2 // 所以 state2处 x = 2
}, {
  op: 'add',
  path: ['y'],
  value: 2
}]
```
inversePatches 如下：
```js
[{
  op: 'replace',
  path: ['x'],
  value: 1 // 所以 state4处 x = 1
}, {
  op: 'remove',
  path: ['y'],
}]
```

## 用immer更新state

```js
state = {
  members: [
    {
      name: 'danny',
      age: 30
    }
  ]
}
```

错误使用：
```js
this.state.members[0].age ++
```

正确使用：
```js
const { members } = this.state
this.setState({
  members: [
    {
      ...members[0],
      age: members[0].age + 1
    },
    ...members.slice(1)
  ]
})
```

immer 优化使用：
```js
this.setState(produce(draft => {
  draft.members[0].age ++
}))
```

## 用immer更新reducer
```js
const reducer = (state, action) => produce(state, draft => {
  switch(action.type) {
    case 'ADD_AGE':
      draft.members[0].age ++
  }
})
```


