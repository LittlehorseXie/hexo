---
title: Redux相关的一些中间件和工具
category: Redux
date: 2020-07-30 14:29
---

本文介绍
- 为什么要用redux和这些中间件、工具，他们用来解决什么问题

本文不介绍
- Redux怎么使用
- Redux源码解析


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

但对于各种复杂场景混合的情况，redux无疑是更优雅的解决方案。




## Redux Thunk 


// component.js




## Redux Saga

- 统一action的形式，在redux-saga中，从UI中dispatch的action为原始对象
- 集中处理异步等存在副作用的逻辑	
- 通过转化effects函数，可以方便进行单元测试
- 完善和严谨的流程控制，可以较为清晰的控制复杂的逻辑












## Redux Promise又是干嘛的



## Redux Loop不是中间件





## DVA



## imuttable


## Reselect


