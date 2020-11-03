---
title: 【怎么用】Redux是如何工作的：一个计数器的栗子
category: Redux
date: 2018-08-27 20:29
top: 80
---

[原文：How Redux Works: A Counter-Example](https://daveceddia.com/how-does-redux-work/)


在学习了一些React并且接触了Redux之后，在Redux是如何生效的这方便确实容易使人困惑。

Actions, reducers, action creators, middleware, pure functions, immutability…这些词看起来都很陌生。

因此这篇文章将通过一个很简单的react+redux小例子来解释redux到底是如何工作的。

### 普通的React State

我们首先从一个简单的React state的例子入手，稍后我们会向里面一点一点的添加Redux。

这是一个计数器：

![image](https://user-images.githubusercontent.com/39767742/44660416-1744a580-aa3a-11e8-8454-691fb5c4e53e.png)

这里是它的代码（去除了css使代码看起来简洁）：

```javascript
import React from 'react';

class Counter extends React.Component {
  state = { count: 0 }

  increment = () => {
    this.setState({
      count: this.state.count + 1
    });
  }

  decrement = () => {
    this.setState({
      count: this.state.count - 1
    });
  }

  render() {
    return (
      <div>
        <h2>Counter</h2>
        <div>
          <button onClick={this.decrement}>-</button>
          <span>{this.state.count}</span>
          <button onClick={this.increment}>+</button>
        </div>
      </div>
    )
  }
}

export default Counter;
```

快速浏览之后，它是这样工作的：

- count状态存储在顶层组件**Counter**中
- 当用户点击加减号的时候，触发click事件，调用increment / decrement函数
- increment / decrement函数更新组件的count
- 由于state更新，React重新渲染**Counter**组件，新的count state展示在组件中

### 快速起步

- npm install -g create-react-app
- create-react-app redux-intro
- 打开src/index.js用下面代码替换它

```javascript
import React from 'react';
import { render } from 'react-dom';
import Counter from './Counter';

const App = () => (
  <div>
    <Counter />
  </div>
);

render(<App />, document.getElementById('root'));
```

使用Counter组件的代码创建一个src/Counter.js的文件。

### 向React Redux前进

Redux将你的app里的所有state都保存在**一个**store中，然后，你可以获取其中的任何数据作为props传递到你的组件里。这使你可以在一个全局的地方（store）获取数据，并且能在app里的任何组件里直接使用，而不是通过多层向下传递props。

注：state是数据，而store是保存数据的地方，一个app只有一个store

### redux vs react-redux

redux提供一个store，用来存取state，并且在state改变的时候作出回应，但它只提供了这些功能。而react-redux才是让state和React组件联系起来的关键所在。redux自己根本就不知道有React这回事儿。

### 让我们开始吧

回到Counter组件里，我们把组件的state去掉，换成redux实现

首先，我们将Couter组件里的state去除，之后我们从redux的store里取数据：

```javascript
import React from 'react';

class Counter extends React.Component {
  increment = () => {
    // fill in later
  }

  decrement = () => {
    // fill in later
  }

  render() {
    return (
      <div>
        <h2>Counter</h2>
        <div>
          <button onClick={this.decrement}>-</button>
          <span>{this.props.count}</span>
          <button onClick={this.increment}>+</button>
        </div>
      </div>
    )
  }
}

export default Counter;
```
### 将Redux与**Counter**组件联系起来

注意到上面的代码 this.state.count 已经变为 this.props.count ，是因为我们通过redux将数据放在了props中。

我们需要使用react-redux中的connect函数将组件与Redux联系起来，才能从Redux的state中获取到需要到数据。

```
import { connect } from 'react-redux';

// Add this function:
function mapStateToProps(state) {
  return {
    count: state.count
  };
}

// Then replace this:
// export default Counter;

// With this:
export default connect(mapStateToProps)(Counter);
```

你可能注意到了connect(mapStateToProps)(Counter)的用法，为什么不是connect(mapStateToProps, Counter)呢？因为connect是一个高阶函数，调用connect函数本身之后返回一个新函数，之后返回的函数接受参数--Counter组件，返回一个新组件。（函数式编程）

connect函数做的事情就是将组件挂钩到Redux上，取到所有的state，然后通过用户提供的mapStateToProps函数来获取所需数据。

mapStateToProps接收Redux store中的state作为参数，经过处理，返回一个新的对象，这个对象会通过props传递到组件中。例如，上面的Counter组件传递state.count为props.count。总的来说就是，mapStateToProps定义了一个从state到props的映射。

### 提供一个store

我们通过connect从Redux的唯一一个store里面获取数据，但是store是从哪儿来的呢？Redux保存了整个app全局的state，并且通过react-redux的**Provider**组件包裹整个app，app里所有的组件都能通过connect来接触到Redux store中它所需的所有数据。

这意味着App、App的子组件（Counter）以及App的孙子、重孙子等，都能访问Redux store，但前提是这些组件使用connect包裹它们。

但是connect所有的组件绝不是一个好的做法（既乱又慢）。

Provider看似神奇，但实际上就是在内部使用了React的context（上下文）功能。它就像一个连接每个组件的秘密通道，然后通过connect打开通往这条通道的大门。

下面，我们在src/index.js中引入Provider

```javascript
import { Provider } from 'react-redux';

...

const App = () => (
  <Provider>
    <Counter/>
  </Provider>
);
```
然后再向Provider中传入store

```javascript
import { createStore } from 'redux';

const store = createStore();

const App = () => (
  <Provider store={store}>
    <Counter/>
  </Provider>
);
```
createStore中需要传递用来返回state的函数参数--reducer。

```javascript
function reducer() {
  // just gonna leave this blank for now
  // which is the same as `return undefined;`
}

const store = createStore(reducer);
```
### reducer是什么

那么reducer是做什么的呢？reducer会接收两个参数--state、action，state即redux中保存的state数据，reducer函数内部通过判断action的type来对当前state进行改变，返回一个新的state，并且必须始终返回一个state。

### action是什么

那么action是什么呢？action是一个对象，里面必传的参数为type，例如这样：

```json
{
   type: "INCREMENT"
}
or
{
  type: "DECREMENT",
  count: 100
}
```

了解了reducer的作用和action后，让我们来完善下reducer

```javascript
// 必要，避免初始为undifined
const initialState = {
  count: 0
};

function reducer(state = initialState, action) {
  switch(action.type) {
    case 'INCREMENT':
      return {
        count: state.count + 1
      };
    case 'DECREMENT':
      return {
        count: state.count - 1
      };
    default:
      return state;
  }
}
```
注意：不要直接转变state里的值，例如：

```javascript
function brokenReducer(state = initialState, action) {
  switch(action.type) {
    case 'INCREMENT':
      // NO! BAD: this is changing state!
      // 如果count是个数组，state.count.push(newItem)也是不允许的
      state.count++;
      return state;
    default:
      // this is fine.
      return state;
  }
}
```
### action从哪儿来的

言归正传，那么我们通过什么来改变state呢？换句话说，action是从哪儿来的？

Redux的store提供了一个dispatch方法，通过store.dispatch(someAction)调用，但是这并不是很方便，因为store只存在于一个文件中，好在connect函数替我们解决了这个问题。除了向组件中注入mapStateToProps函数返回的state作为props，connect还向props中注入了dispatch函数，因此，我们直接调用this.props.dispatch就可以了。

下面，我们更新Counter组件，使它发起action来实现加减功能

```javascript
import React from 'react';
import { connect } from 'react-redux';

class Counter extends React.Component {
  increment = () => {
    this.props.dispatch({ type: 'INCREMENT' });
  }

  decrement = () => {
    this.props.dispatch({ type: 'DECREMENT' });
  }

  render() {
    return (
      <div>
        <h2>Counter</h2>
        <div>
          <button onClick={this.decrement}>-</button>
          <span>{this.props.count}</span>
          <button onClick={this.increment}>+</button>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    count: state.count
  };
}

export default connect(mapStateToProps)(Counter);
```

总结：状态是只读的, 并且actions是修改它的唯一方法。改变state只有一种方式: dispatch(action) --> reducer  --> new state --> 重新渲染页面。reducer必须是纯函数--它不能修改它的参数-state。

### 最后，让我们来理理整体的思路

- 我们先写了一个mapStateToProps函数，将Redux state中的我们需要的数据映射到组件内的props里
- 然后，我们通过react-redux提供的connect函数将Redux store和组件联系起来--connect(mapStateToProps)(组件名)，并提供dispatch函数
- 我们将整个app用react-redux提供的Provider组件包裹，并传store参数
- store由redux提供的createStore函数生成，传参为reducer
- 我们创建一个reducer函数，来通过action的type来处理state，并返回新的state（注意初始化state）
- 最后，我们通过dispatch(action)来改变state

### 写在最最后

我们只是用计数器的例子来作为一个教学工具，实际开发中，如果这种体型的app使用了redux，绝对是画蛇添足，React state完全能够满足这种简单的工程。Redux绝非一个必需品。

