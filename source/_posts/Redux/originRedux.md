---
title: Redux源码解析
category: Redux
date: 2020-07-30 20:29
---

## Redux做了什么

其实我们只是想找个地方存放一些共享数据而已，大家都可以获取到，也都可以进行修改，仅此而已。
那放在一个全部变量里面行不行？行，当然行，但是太不优雅，也不安全，因为是全局变量嘛，谁都能访问、谁都能修改，有可能一不小心被哪个小伙伴覆盖了也说不定。那全局变量不行就用私有变量呗，私有变量、不能轻易被修改，是不是立马就想到闭包了...

现在要写这样一个函数，其满足：

- 存放一个数据对象
- 外界能访问到这个数据
- 外界也能修改这个数据
- 当数据有变化的时候，通知订阅者


```javascript
function createStore(reducer, initialState) {
  // currentState就是那个数据
  let currentState = initialState;
  let listener = () => {};

  function getState() {
    return currentState;
  }
  function dispatch(action) {
    currentState = reducer(currentState, action); // 更新数据
    listener(); // 执行订阅函数
    return action;
  }
  function subscribe(newListener) {
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

更新数据执行的步骤：

- What：想干什么 --- dispatch(action)
- How：怎么干，干的结果 --- reducer(oldState, action) => newState
- Then?：重新执行订阅函数（比如重新渲染UI等）

这样就实现了一个store，提供一个数据存储中心，可以供外部访问、修改等，这就是Redux的主要思想。

所以，Redux和React没有什么本质关系，Redux可以结合其他库正常使用。只不过Redux这种数据管理方式，跟React的数据驱动视图理念很合拍，它俩结合在一起，开发非常便利。

那么redux怎么和react关联起来呢？

我们可以在应用初始化的时候，创建一个`window.store = createStore(reducer)`，然后在需要的地方通过`store.getState()`去获取数据，通过`store.dispatch`去更新数据，通过`store.subscribe`去订阅数据变化然后进行setState...如果很多地方都这样做一遍，实在是不堪其重，而且，还是没有避免掉全局变量的不优雅。

## React-Redux


由于全局变量有诸多的缺点，那就换个思路，把store直接集成到React应用的顶层props里面，只要各个子组件能访问到顶层props就行了，比如这样：

```javascript
<TopWrapComponent store={store}>
  <App />
</TopWrapComponent>
```

React恰好提供了一个钩子--Context（可以参考 [这里](/Redux/aboutRedux/#使用Context解决场景一) 回顾一下）,可以让每个子组件都能访问到store。
接下来，就是子组件把store中用到的数据取出来、修改、以及订阅更新UI等。每个子组件都需要这样做一遍，显然，肯定有更便利的方法：高阶组件。



