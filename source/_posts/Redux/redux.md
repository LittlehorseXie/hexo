---
title: Redux相关的一些中间件和工具
category: Redux
date: 2020-07-30 14:29
top: 100
---

本文介绍
- 为什么要用redux和这些中间件、工具，他们用来解决什么问题
- 简单介绍除redux之外的这些中间件、工具如何使用

本文不介绍
- Redux怎么使用
- 源码解析


## 为什么要用Redux

一些小型项目，只使用 React 完全够用了，数据管理使用`props、state`即可。

```javascript
class App extends React.Component {
  render() {
    return <Toolbar theme="dark" />;
  }
}

function Toolbar(props) {
  // Toolbar 组件接受一个额外的“theme”属性，然后传递给 ThemedButton 组件。
  // 如果应用中每一个单独的按钮都需要知道 theme 的值，这会是件很麻烦的事，
  // 因为必须将这个值层层传递所有组件。
  return (
    <div>
      <ThemedButton theme={props.theme} />
    </div>
  );
}

class ThemedButton extends React.Component {
  render() {
    return <Button theme={this.props.theme} />;
  }
}
```

但随着项目复杂度的增加，数据传递会越来越复杂（父组件向子组件通信、子组件向父组件通信、兄弟组件通信 — 各种向不同层级的组件传递相同的数据（比如用户信息、UI主题等）），你会遇到类似下面的这些场景：

### 场景一

数据传递：`A --> B --> C --> D --> E`，E需要的数据需要从A那里通过props传递过来，以及对应的 E --> A逆向传递callback。
但是，组件BCD是不需要这些数据的，而又必须经由它们来进行传递数据，而且传递的props以及callback对BCD组件的复用也会造成影响。


### 场景二
数据传递：`A --> B、A --> C 、A —> D、A —> E`，或者兄弟组件之间想要共享某些数据，也不是很方便传递、获取等。


### 使用Context解决场景一
对于场景一，使用`Context`就可以避免通过中间元素传递 props。

```javascript
/** 
 * Context 可以让我们无须显示的通过组件树逐层传递 props，就能将值深入传递进组件树。
 * 为当前的 theme 创建一个 context（“light”为默认值）。 
**/
const ThemeContext = React.createContext('light');

class App extends React.Component {
  render() {
    // 使用一个 Provider 来将当前的 theme 传递给以下的组件树。
    // 无论多深，任何组件都能读取这个值。
    // 在这个例子中，我们将 “dark” 作为当前的值传递下去。
    return (
      <ThemeContext.Provider value="dark">
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}

// 中间的组件再也不必指明往下传递 theme 了。
function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

class ThemedButton extends React.Component {
  // 指定 contextType 读取当前的 theme context。
  // React 会往上找到最近的 theme Provider，然后使用它的值。
  // 在这个例子中，当前的 theme 值为 “dark”。
  // 挂载在 class 上的 contextType 属性会被重赋值为一个由 React.createContext() 创建的 Context 对象。
  // 这能让你使用 this.context 来消费最近 Context 上的那个值
  // 消费多个 Context时，需要使用Context.Consumer
  static contextType = ThemeContext;
  render() {
    return <Button theme={this.context} />;
  }
}
```

React作为一个组件化开发框架，组件之间存在大量通信，有时这些通信跨越多个组件，或者多个组件之间共享一套数据，简单的父子组件间传值不能满足我们的需求，自然而然地，我们需要有一个地方存取和操作这些公共状态。而redux就为我们提供了一种管理公共状态的方案。

[Redux源码解析](../codeRedux/)


## 一个异步的例子 -- 本部分完全摘自redux官方中文文档

redux只能同步操作，即dispatch action 时，state 会被立即更新。那么 Redux 究竟是如何处理异步数据流的呢？

当调用异步 API 时，有两个非常关键的时刻：发起请求的时刻，和接收到响应的时刻（也可能是超时）。

这两个时刻都可能会更改应用的 state；为此，你需要 dispatch 普通的同步 action。一般情况下，每个 API 请求都需要 dispatch 至少三种 action：

> 1. **一种通知 reducer 请求开始的 action。**
>对于这种 action，reducer 可能会切换一下 state 中的 isFetching 标记。以此来告诉 UI 来显示加载界面。
> 2. **一种通知 reducer 请求成功的 action。**
> 对于这种 action，reducer 可能会把接收到的新数据合并到 state 中，并重置 isFetching。UI 则会隐藏加载界面，并显示接收到的数据。
> 3. **一种通知 reducer 请求失败的 action。**
> 对于这种 action，reducer 可能会重置 isFetching。另外，有些 reducer 会保存这些失败信息，并在 UI 里显示出来。

为了区分这三种 action，可能在 action 里添加一个专门的 status 字段作为标记位：

```php
{ type: 'FETCH_POSTS' }
{ type: 'FETCH_POSTS', status: 'error', error: 'Oops' }
{ type: 'FETCH_POSTS', status: 'success', response: { ... } }
```

又或者为它们定义不同的 type：
```php
{ type: 'FETCH_POSTS_REQUEST' }
{ type: 'FETCH_POSTS_FAILURE', error: 'Oops' }
{ type: 'FETCH_POSTS_SUCCESS', response: { ... } }
```

究竟使用带有标记位的同一个 action，还是多个 action type 呢，完全取决于你。这应该是你的团队共同达成的约定。使用多个 type 会降低犯错误的机率，但是如果你使用像 redux-actions 这类的辅助库来生成 action 创建函数和 reducer 的话，这就完全不是问题了。

无论使用哪种约定，一定要在整个应用中保持统一。
在本教程中，我们将使用不同的 type 来做。下面我们举个例子：
Web 应用经常需要展示一些内容的列表，比如，帖子的列表，朋友的列表

### 设计 state 结构
首先要明确应用要显示哪些列表。然后把它们分开储存在 state 中，这样你才能对它们分别做缓存并且在需要的时候再次请求更新数据。
"Reddit 头条" 应用会长这个样子：
```js
{
  selectedsubreddit: 'frontend',
  postsBySubreddit: {
    frontend: {
      isFetching: true, // 显示进度条
      didInvalidate: false, // 数据是否过期
      items: []
    },
    reactjs: {
      isFetching: false,
      didInvalidate: false,
      lastUpdated: 1439478405547, // 存放数据最后更新时间
      items: [ // 列表信息
        {
          id: 42,
          title: 'Confusion about Flux and Relay'
        },
        {
          id: 500,
          title: 'Creating a Simple Application Using React JS and Flux Architecture'
        }
      ]
    }
  }
}
```

### 同步 Action 创建函数

```js
export function selectSubreddit(subreddit) { // 更改目前选中的tab-selectedsubreddit
  return {
    type: SELECT_SUBREDDIT,
    subreddit
  }
}
export function invalidatesubreddit(subreddit) { // 刷新
  return {
    type: INVALIDATE_SUBREDDIT,
    subreddit
  }
}
export function requestPosts(subreddit) { // 触发请求数据动作
  return {
    type: REQUEST_POSTS,
    subreddit
  }
}
export function receivePosts(subreddit, json) { // 接受后端返回的数据
  return {
    type: RECEIVE_POSTS,
    subreddit,
    posts: json.data.children.map(child => child.data),
    receivedAt: Date.now()
  }
}
```

### 创建reducer

为了方便管理，通过`combineReducers(reducers)`来拆分reducer，拆分后的每个reducer函数负责独立管理 state 的一部分。

> combineReducers 辅助函数的作用是，把一个由多个不同 reducer 函数作为 value 的 object，合并成一个最终的 reducer 函数。
> 合并后的 reducer 可以调用各个子 reducer，并把它们返回的结果合并成一个 state 对象。
> combineReducers() 返回的 state 对象，会将传入的每个 reducer 返回的 state 按其传递给 combineReducers() 时对应的 key 进行命名。

```js
function selectedsubreddit(state = 'frontend', action) {
  switch (action.type) {
    case SELECT_SUBREDDIT:
      return action.subreddit
    default:
      return state
  }
}

function posts(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: []
  },
  action
) {
  switch (action.type) {
    case INVALIDATE_SUBREDDIT:
      return Object.assign({}, state, {
        didInvalidate: true
      })
    case REQUEST_POSTS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      })
    case RECEIVE_POSTS:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.posts,
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}

function postsBySubreddit(state = {}, action) {
  switch (action.type) {
    case INVALIDATE_SUBREDDIT:
    case RECEIVE_POSTS:
    case REQUEST_POSTS:
      return Object.assign({}, state, {
        [action.subreddit]: posts(state[action.subreddit], action)
      })
    default:
      return state
  }
}

const rootReducer = combineReducers({
  selectedsubreddit,
  postsBySubreddit,
})

export default rootReducer
```

### 异步 Action 创建函数

最后，如何把 之前定义 的同步 action 创建函数和网络请求结合起来呢？标准的做法是使用 Redux Thunk 中间件。


## Redux Thunk - 用最简单的方式搭建异步 action 构造器

之前我们的action创建函数返回的都是一个对象，使用 Redux Thunk 中间件后，action 创建函数除了返回 action 对象外还可以返回函数。这时，这个 action 创建函数就成为了 thunk。
当 action 创建函数返回函数时，这个函数会被 Redux Thunk middleware 执行。
这个函数并不需要保持纯净；它还可以带有副作用，包括执行异步 API 请求。这个函数还可以 dispatch action，就像 dispatch 前面定义的同步 action 一样。

### 用thunk改写同步action

```js
// 新增 thunk action
// 调用方式和普通action一样 store.dispatch(fetchPosts('reactjs'))
export function fetchPost(subreddit) {
  // 这里把 dispatch 方法通过参数的形式传给函数，
  // 以此来让它自己也能 dispatch action。
  return function (dispatch, getState) {
    dispatch(requestPosts(subreddit))

    // thunk middleware 调用的函数可以有返回值，
    // 它会被当作 dispatch 方法的返回值传递。
    // 比如下面返回一个Promise，可以让 store.dispatch(fetchPosts('reactjs')).then(...)

    return fetch(`http://www.subreddit.com/r/${subreddit}.json`)
      .then(res => {
        dispatch(receivePosts(subreddit, res))
      })
  }
}
```


## Redux Saga -- Redux 应用的另一种副作用 model

- 统一action的形式，在redux-saga中，从UI中dispatch的action为原始对象
- 集中处理异步等存在副作用的逻辑	
- 通过转化effects函数，可以方便进行单元测试
- 完善和严谨的流程控制，可以较为清晰的控制复杂的逻辑












## Redux Promise又是干嘛的 - 遵从 FSA 标准的 promise 中间件

## Redux ToolKit

## Redux Loop不是中间件





## DVA



## imuttable


## Reselect


