---
title: Reselect
category: Redux
date: 2020-08-24 15:37
top: 80
---

## 为什么需要reselect - 遇到的问题

先看下面的组件

```js
import React, { Component } from 'react'
import connect from 'react-redux'

class UnusedComp extends Component {
  render () {
    const {a, b, c, fab, hbc, gac, uabc} = this.props
    return (<div>
     <h6>{a}</h6>
     <h6>{b}</h6>
     <h6>{c}</h6>
     <h6>{fab}</h6>
     <h6>{hbc}</h6>
     <h6>{gac}</h6>
     <h6>{uabc}</h6>
    </div>)
  }
}

function f(x, y) {
  return x + y
}
function h(x, y) {
  return x + y * 2
}
function g(x, y) {
  return x * 2 + y
}
function u(x, y, z) {
  return x + y + z
}
```
原始数据只有a b c，那么这几个计算的值，我们如何处理呢

### 把数据直接放在redux里

但是这样reducer函数会变得很复杂，每更新一个状态值，还要维护与这个值相关的值

### 只维护基本状态

为了保证数据流的清晰，更新的简洁，我们只把最基本的状态存储在redux

这时，我们的组件是这样的：

```js
class UnusedComp extends Component {
  render () {
    const {a, b, c} = this.props
    const fbc = f(b, c)
    const hbc = h(b, c)
    const gbc = g(b, c)
    const uabc = u(a, b, c)
    return (<div>
     <h6>{a}</h6>
     <h6>{b}</h6>
     <h6>{c}</h6>
     <h6>{fab}</h6>
     <h6>{hbc}</h6>
     <h6>{gac}</h6>
     <h6>{uabc}</h6>
    </div>)
  }
}
```

或者是这样的

```js
class UnusedComp extends Component {
  componentWillReceiveProps(nextProps) {
    const {a, b, c} = nextProps
    this.fbc = f(b, c)
    this.hbc = h(b, c)
    this.gbc = g(b, c)
    this.uabc = u(a, b, c)
  }
  render () {
    const {a, b, c} = this.props
    return (<div>
     <h6>{a}</h6>
     <h6>{b}</h6>
     <h6>{c}</h6>
     <h6>{fab}</h6>
     <h6>{hbc}</h6>
     <h6>{gac}</h6>
     <h6>{uabc}</h6>
    </div>)
  }
}
```

对于第一种情况，当组件所有props改变或setState时，都会执行计算
对于第二种情况，当组件所有props改变就会执行计算，即使是进行判断abc是否改变，也有很多额外的判断代码
如果数据很复杂，这些无用计算就会导致性能上的不足，而且这两种都违背了我们的基本规则：`保持组件逻辑简单`

让数据逻辑离开组件！

```js
class UnusedComp extends Component {
  render () {
    const {a, b, c, fab, hbc, gac, uabc} = this.props
    return (<div>
     <h6>{a}</h6>
     <h6>{b}</h6>
     <h6>{c}</h6>
     <h6>{fab}</h6>
     <h6>{hbc}</h6>
     <h6>{gac}</h6>
     <h6>{uabc}</h6>
    </div>)
  }
}
function mapStateToProps(state) {
  const {a, b, c} = state
  return {
    a, b, c,
    fab: f(a, b),
    hbc: h(a, b),
    gac: g(a, b),
    uabc: u(a, b, c)
  }
}
UnusedComp = connect(mapStateToProps)(UnusedComp)
```

组件很简单，接收计算好的数据进行展示就行了。看似很美好，但我们知道，当store数据改变的时候，会通知所有connect的组件
所以如果UnusedComp的兄弟组件或父组件的任意存在redux里的状态改变了，即使不是abc，也会触发fhgu的计算
又或者UnusedComp还有d\e状态属性，d、e改变了也会触发计算

### 精准控制计算 -- 避免不必要的计算

```js
let memolizeState = null
function mapStateToProps(state) {
  const {a, b, c} = state
  if (!memolizeState) {
    memolizeState = {
      a,
      b,
      c,
      fab: f(a, b),
      hbc: h(a, b),
      gac: g(a, b),
      uabc: u(a, b, c)
    }
  } else {
    if (!(a === memolizeState.a && b ==== memolizeState.b)) {
      memolizeState.fab = f(a, b)
    }
    ...
  }
  return memolizeState
}
```

## 使用reselect

reselect就是用来解决上述问题的

```js
import {createSelector} from 'reselect'
fSelector = createSelector(state => state.a, state => state.b, (a, b) => f(a,b))
...
function mapStateToProps(state) {
  const {a, b, c} = state
  return {
    a, b, c,
    fab: fSelector(a, b),
    hbc: hSelector(a, b),
    gac: gSelector(a, b),
    uabc: uSelector(a, b, c)
  }
}
```

在createSelector里 我们先定义了`input-selector`函数，最后定义了值是怎么计算出来的
selector保证了，当input-selector返回结果相等的时候，不会计算

## reselect源码解读

算上空行，一共108行

```js
function defaultEqualityCheck(a, b) {
  return a === b
}

// 校验是不是每一个依赖参数的函数都是函数，如果不是 抛出报错信息
function getDependencies(funcs) {
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs

  if (!dependencies.every(dep => typeof dep === 'function')) {
    const dependencyTypes = dependencies.map(
      dep => typeof dep
    ).join(', ')
    throw new Error(
      'Selector creators expect all input-selectors to be functions, ' +
      `instead received the following types: [${dependencyTypes}]`
    )
  }

  return dependencies
}

// 判断 新旧参数数组 里的每一项 是否相等 
function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
  // 如果为null或长度不同 直接返回false
  if (prev === null || next === null || prev.length !== next.length) {
    return false
  }

  // 使用for循环 为了随时能跳出循环
  const length = prev.length
  for (let i = 0; i < length; i++) {
    if (!equalityCheck(prev[i], next[i])) {
      return false
    }
  }

  return true
}

// 闭包，保存上次的结果
export function defaultMemoize(func, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null
  let lastResult = null

  return function () {
    if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
      // 此处的arguments为 调用memoize(func)(a) 处的a 也就是memoize里层 return function() 处的传参
      lastResult = func.apply(null, arguments)
    }

    lastArgs = arguments
    return lastResult
  }
}

// 返回的是
export function createSelectorCreator(memoize, ...memoizeOptions) {
  // funcs 为 用户调用暴露的 createSelector 时的传参，调用后返回selector
  return (...funcs) => {
    let recomputations = 0
    // 获取用户传参的最后一项，也就是计算函数 
    const resultFunc = funcs.pop() // (a, b) => f(a,b)
    // pop后的funcs为计算函数的依赖项，判断依赖函数是否合法
    const dependencies = getDependencies(funcs) // [state => state.a, state => state.b]

    const memoizedResultFunc = memoize(
      function () {
        recomputations++
        // 此处的arguments是 memoizedResultFunc调用时候的传参，也就是params，也就是每一个依赖项值的数组
        return resultFunc.apply(null, arguments)
      },
      ...memoizeOptions
    )

    const selector = memoize(function () {
      // 注意：此处必须是function 如果是箭头函数，arguments会变为createSelectorCreator的参数 也就是 [defaultMemoize]
      const params = []
      const length = dependencies.length

      for (let i = 0; i < length; i++) {

        // 此处的arguments是 selector调用时的传参，也就是state
        // dependencies[0] 为 state => state.a，所以 push 进去的 为 state.a 的值
        params.push(dependencies[i].apply(null, arguments))
      }

      // apply arguments instead of spreading for performance.
      return memoizedResultFunc.apply(null, params)
    })

    selector.resultFunc = resultFunc
    selector.dependencies = dependencies
    selector.recomputations = () => recomputations
    selector.resetRecomputations = () => recomputations = 0
    return selector
  }
}

export const createSelector = /* #__PURE__ */ createSelectorCreator(defaultMemoize)


// 把createStructuredSelector(selectors, createSelector)当作connnect的mapStateToProps参数使用
// 也就是 通过这里把state传过去的
export function createStructuredSelector(selectors, selectorCreator = createSelector) {
  if (typeof selectors !== 'object') {
    throw new Error(
      'createStructuredSelector expects first argument to be an object ' +
      `where each property is a selector, instead received a ${typeof selectors}`
    )
  }
  const objectKeys = Object.keys(selectors)
  return selectorCreator(
    objectKeys.map(key => selectors[key]),
    (...values) => {
      return values.reduce((composition, value, index) => {
        composition[objectKeys[index]] = value
        return composition
      }, {})
    }
  )
}
```
