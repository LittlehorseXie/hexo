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
而且这两种都违背了我们的基本规则：`保持组件逻辑简单`

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
fSelector = createSelector(a => state.a, b => state.b, (a, b) => f(a,b))
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

在createSelector里 我们先定义了`input-selector`函数，最后定义了值是怎么计算出来的。selector保证了，当input-selector返回结果相等的时候，不会计算


