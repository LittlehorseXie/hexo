---
title: 【代码分析】Redux设计实现剖析
category: Redux
date: 2020-07-30 20:29
top: 70
---

## Redux做了什么

其实我们只是想找个地方存放一些共享数据，所有文件都可以获取到，也都可以进行修改。

### 1. 那放在一个全局变量里面行不行？
```javascript
const state = {    
  count: 0
}
```
行，但是有两个问题：

1. 容易误操作：比如有人一个不小心把store赋值了{}，清空了store，或者误修改了其他组件的数据，那显然不太安全，出错了也很难排查，因此我们需要有条件地操作store，防止使用者直接修改store的数据

2. 可读性很差: JS是一门极其依赖语义化的语言，试想如果在代码中不经注释直接修改了公用的state，以后其他人维护代码得多懵逼，为了搞清楚修改state的含义还得根据上下文推断，所以我们最好是给每个操作起个名字。

### 2. getter 和 setter

根据我们上面的分析，我们希望公共状态既能够被全局访问到，又是私有的不能被直接修改，思考一下，闭包是不是就就正好符合这两条要求，因此我们会把公共状态设计成`闭包`

现在要写这样一个函数，其满足：

- 存放一个数据对象
- 外界能访问到这个数据
- 外界也能修改这个数据
- 当数据有变化的时候，通知订阅者


```javascript
function createStore(reducer, initialState) {
  let currentState = initialState; // 1. 公共状态    
  let listener = () => {};

  function getState() { // 2. getter
    return currentState;
  }
  function dispatch(action) { // 3. setter
    currentState = reducer(currentState, action); // 更新数据
    listener(); // 执行订阅函数
    return action;
  }
  function subscribe(newListener) { // 4. 发布订阅    
    listener = newListener;
    // 取消订阅函数
    return function unsubscribe() {
      listener = () => {};
    };
  }
  return {
    getState,
    dispatch,
    subscribe
  };
}

const store = createStore(reducer);
store.getState(); // 获取数据
store.dispatch({type: 'ADD_TODO'}); // 更新数据
store.subscribe(() => {/* update UI */}); // 注册订阅函数
```

上面的 initialState 是为了获取初始state，除了把initialState通过传参传进来，还可以通过先进行一次初始化dispatch的方式

```javascript
export const createStore = (reducer) => {        
    let currentState = {}        
    function getState() { ... }        
    function dispatch() { ... }        
    function subscribe() { ... }    
    // 初始化store数据 
    // 这个dispatch的actionType可以随便填，只要不和已有的type重复，让reducer里的switch能走到default去初始化store就行了
    dispatch({ type: '@@REDUX_INIT' })
    return { ... }
}
```

更新数据执行的步骤：

- What：想干什么 --- dispatch(action)
- How：怎么干，干的结果 --- reducer(oldState, action) => newState
- Then?：重新执行订阅函数（比如重新渲染UI等）

这样就实现了一个store，提供一个数据存储中心，可以供外部访问、修改等，这就是Redux的主要思想。

所以，Redux和React没有什么本质关系，Redux可以结合其他库正常使用。只不过Redux这种数据管理方式，跟React的数据驱动视图理念很合拍，它俩结合在一起，开发非常便利。

### 3. 那么redux怎么和react关联起来呢？

我们可以在应用初始化的时候，创建一个`window.store = createStore(reducer)`或每个组件通过`import引入store`，然后在需要的地方通过`store.getState()`获取数据，通过`store.dispatch`更新数据，通过`store.subscribe`订阅数据变化然后进行setState...如果很多地方都这样做一遍，实在是不堪其重。

