---
title: 【代码分析】React-redux设计实现剖析
category: Redux
date: 2020-07-30 20:29
top: 69
---

## React-Redux 的实现

React恰好提供了一个钩子--Context（可以参考 [这里](/Redux/aboutRedux/#使用Context解决场景一) 回顾一下）,可以让每个子组件都能访问到store。

接下来，就是子组件把store中用到的数据取出来、修改、以及订阅更新UI等。每个子组件都需要这样做一遍，显然，肯定有更便利的方法：高阶组件。

通过高阶组件把`store.getState()、store.dispatch、store.subscribe`封装起来，子组件对store就无感知了，子组件正常使用props获取数据以及正常使用callback触发回调，相当于没有store存在一样。

react-redux提供`Provider`和`connect`两个API，Provider将store放进this.context里，省去了import这一步，connect将getState、dispatch合并进了this.props，并自动订阅更新，简化了另外三步，下面我们来看一下如何实现这两个API：

### 1. Provider实现

Provider是一个组件，接收store并放进全局的context对象

```javascript
class Provider extends React.Component {
  constructor(props, context) {    
    super(props, context)    
    this.store = props.store  
  }
  // 需要声明静态属性childContextTypes来指定context对象的属性,是context的固定写法  
  static childContextTypes = {
    store: ProtoTypes.object
  }
  // 实现getChildContext方法,返回context对象,也是固定写法  
  getChildContext() {    
    return { store: this.store }  
  }
  // 渲染被Provider包裹的组件  
  render() {    
    return this.props.children  
  }
}
```

完成Provider后，我们就能在组件中通过this.context.store这样的形式取到store，不需要再单独import store或把store放到全局变量里了。


### 2. connect实现

下面我们来思考一下如何实现connect，我们先回顾一下connect的使用方法：
```javascript
connect(mapStateToProps, mapDispatchToProps)(App)
```

我们已经知道，connect接收mapStateToProps、mapDispatchToProps两个方法，然后返回一个高阶函数，这个高阶函数接收一个组件，返回一个高阶组件（其实就是给传入的组件增加一些属性和功能）connect根据传入的map，将state和dispatch(action)挂载子组件的props上


下面是connect高阶组件的大致实现：

```javascript
function connect(mapStateToProps, mapDispatchToProps) {
  return function(WrappedComponent) {
    return class Connect extends React.Component {
      componentDidMount() {
        // 从context获取store并订阅更新 
        this.unsubscribe = this.context.store.subscribe(this.handleStoreChange.bind(this))
      }
      componentWillUnmount() {
        this.unsubscribe();
      }
      handleStoreChange() {
        // 触发更新          
        // 触发的方法有多种,这里为了简洁起见,直接forceUpdate强制更新,读者也可以通过setState来触发子组件更新
        this.forceUpdate()
      }
      render() {
        return (
          <WrappedComponent
            // 传入该组件的props,需要由connect这个高阶组件原样传回原组件 
            {...this.props}
            // 根据mapStateToProps把state挂到this.props上
            {...mapStateToProps(this.context.store.getState())}
            // 根据mapDispatchToProps把dispatch(action)挂到this.props上 
            {...mapDispatchToProps(this.context.store.dispatch)}
          />
        )
      }
    }
    //接收context的固定写法      
    Connect.contextTypes = {        
        store: PropTypes.object      
    }      
    return Connect
  }
}
```
其实connect完全可以把App跟着mapStateToProps一起传进去，看似没必要return一个函数再传入App，为什么react-redux要这样设计呢？

其实connect这种设计，是`装饰器模式`的实现，所谓装饰器模式，简单地说就是对类的一个包装，动态地拓展类的功能。connect以及React中的高阶组件（HoC）都是这一模式的实现。除此之外，也有更直接的原因：这种设计能够兼容ES7的装饰器(Decorator)，使得我们可以用@connect这样的方式来简化代码

### 3. combineReducers 实现


### 4. compose 实现


