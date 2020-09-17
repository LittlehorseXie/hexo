---
title: 【为什么】要用Immutable
category: Redux
date: 2020-08-17 17:26
top: 89
---

在谈及 Immutable 数据之前，我们先来聊聊 React 组件是怎么渲染更新的。

## React 组件的更新方式

### state的直接改变

React 组件的更新是由状组件态改变引起，这里的状态一般指组件内的 state 对象，当某个组件的 state 发生改变时，组件在更新的时候将会经历如下过程：

- shouldComponentUpdate
- componentWillUpdate
- render()
- componentDidUpdate

state 的更新一般是通过在组件内部执行 this.setState 操作, 但是 setState 是一个异步操作，它只是执行将要修改的状态放在一个执行队列中，React 会出于性能考虑，把多个 setState 的操作合并成一次进行执行。

### props 的改变

除了 state 会导致组件更新外，外部传进来的 props 也会使组件更新，但是这种是当子组件直接使用父组件的 props 来渲染, 例如：

```js
render(){
	return <span>{this.props.text}</span>
}
```
当 props 更新时，子组件将会渲染更新，其运行顺序如下：

- componentWillReceiveProps (nextProps)
- static getDerivedStateFromProps()
- shouldComponentUpdate
- componentWillUpdate
- render
- getSnapshotBeforeUpdate()
- componentDidUpdate

### state 的间接改变

还有一种就是将 props 转换成 state 来渲染组件的，这时候如果 props 更新了，要使组件重新渲染，就需要在 componentWillReceiveProps 生命周期中将最新的 props 赋值给 state

## React 的组件更新过程

当某个 React 组件发生更新时（state 或者 props 发生改变），React 将会根据新的状态构建一棵新的 Virtual DOM 树，然后使用 diff 算法将这个 Virtual DOM 和 之前的 Virtual DOM 进行对比，如果不同则重新渲染。React 会在渲染之前会先调用 shouldComponentUpdate 这个函数是否需要重新渲染，React 中 shouldComponentUpdate 函数的默认返回值是 true，所以组件中的任何一个位置发生改变了，组件中其他不变的部分也会重新渲染。

### PureComponent 的浅比较

基于上面提到的性能问题，所以 React 又推出了 PureComponent，通过
```js
shouldUpdate =
  !shallowEqual(prevProps, nextProps) ||
  !shallowEqual(inst.state, nextState)
```
判断组件是否应该更新

利用上述两种方法虽然可以避免没有改变的元素发生不必要的重新渲染，但是下面的这些场景还是会带来一些问题：

### 场景1

引用赋值虽然可以节省内存，但当应用复杂之后，可变状态往往会变成噩梦
如果state如下，直接修改了data.list[0].name = 'ccc'，本期望在改变之后组件可以重新渲染，但实际上并不会渲染

```js
const data = {
  list: [{
    name: 'aaa',
    sex: 'man'
  },{
    name: 'bbb',
    sex: 'woman'
  }],
  status: true,
}
```

### 场景2

如果state如下，数据异常丰富，需要修改深层级的某一个值时
如果用`Object.assign`写法过于复杂，且深层还是浅拷贝；
如果用`深拷贝`会浪费内存，且深拷贝复杂引用类型时需要深度遍历，这样的做法在React这样频繁更新数据的场景，性能不佳，比如拥有 100,000 个属性的对象，这个操作耗费了 134ms。性能损失主要原因是 “结构共享” 操作需要遍历近10万个属性，而这些引用操作耗费了100ms以上的时间
如果用`Map`，就性能而言可以替代 Immutable，但就结合 react state 使用而言，无法替代 Immutable。
react state  判断数据更新的条件是，对象引用是否变化。Map 跪在这个特性上，它无法使 set 后的 map 对象产生一份新的引用。这样会导致更改了子属性后，不会触发 reRender。因此虽然 Map 性能不错，但无法胜任 Object.assign 或 immutablejs 库对 react state 的支持。


```js
const data = {
  a: {
    a: {a: 1,b: {a:3, b:5, c: {a: {a: {b: 0}}}},
    b: {a: 2,b: {a:3, b:5, c: {a: {a: {b: 0}}}}}
  }
}
```

解决办法就是`减少引用指向的操作数量`，而且由于引用指向到任何对象的损耗都几乎一致（无论目标对象极限小或者无穷大，引用消耗时间都几乎没有区别），我们需要一种精心设计的树状结构将打平的引用建立深度，以减少引用操作次数。
Immulate可以很好地解决这些问题。


## immutable 登场


### immutable 是什么

![](../../assets/Redux/immutable.gif)

相对于muttable，Immutable就是在创建变量，赋值后便不可更改，若对其有任何变更，就会传回一个新值

### immutable 和 mutable对比

```js
state = {
  count1: {
    a: 1,
  }
  count2: fromJS({
    a: 1,
  }),
};
handleClick = () => { 
  this.state.count1.a = 9
  console.log(this.state.count1.a) // 是9

  this.state.count2.set('a', 9)
  console.log(this.state.count2.getIn('a')) // 还是1，因为上边set更改之后返回了一个新的数据
```

```js
state = {
  count1: {
    a: 1,
  }
  count2: fromJS({
    a: 1,
  }),
};
handleClick = () => { 
  this.state.count1.a = 9
  console.log(this.state.count1.a) // 是9

  const count2 = this.state.count2.set('a', 9)
  this.state.count2 = count // 手动赋值
  console.log(this.state.count2.getIn('a')) // 是9，注意 仍不会触发render
```

### Immutable.js 几种数据类型

List: 有序索引集，类似JavaScript中的Array。
Map: 无序索引集，类似JavaScript中的Object。
OrderedMap: 有序的Map，根据数据的set()进行排序。
Set: 没有重复值的集合。
OrderedSet: 有序的Set，根据数据的add进行排序。
Stack: 有序集合，支持使用unshift()和shift()添加和删除。
Record: 一个用于生成Record实例的类。类似于JavaScript的Object，但是只接收特定字符串为key，具有默认值。
Seq: 序列，但是可能不能由具体的数据结构支持。
Collection: 是构建所有数据结构的基类，不可以直接构建。

### Immutable.js 常用API

**fromJS()**
作用：将一个js数据转换为Immutable类型的数据 用法：fromJS(value, converter) 简介：value是要转变的数据，converter是要做的操作。第二个参数可不填，默认情况会将数组准换为List类型，将对象转换为Map类型，其余不做操作

**toJS()**
作用：将一个Immutable数据转换为JS类型的数据 用法：value.toJS()

**is()**
作用：对两个对象进行比较 用法：is(map1,map2) 简介：和js中对象的比较不同，在js中比较两个对象比较的是地址，但是在Immutable中比较的是这个对象hashCode和valueOf，只要两个对象的hashCode相等，值就是相同的，避免了深度遍历，提高了性能

**List() 和 Map()**
作用：用来创建一个新的List/Map对象 用法:
//List
Immutable.List(); // 空List
Immutable.List([1, 2]);

//Map
Immutable.Map(); // 空Map
Immutable.Map({ a: '1', b: '2' });

**List.isList() 和 Map.isMap()**
作用：判断一个数据结构是不是List/Map类型 用法：
List.isList([]); // false
List.isList(List()); // true

Map.isMap({}) // false
Map.isMap(Map()) // true


**get() 、 getIn()**
作用：获取数据结构中的数据
//获取List索引的元素
ImmutableData.get(0);

// 获取Map对应key的value
ImmutableData.get('a');

// 获取嵌套数组中的数据
ImmutableData.getIn([1, 2]);

// 获取嵌套map的数据
ImmutableData.getIn(['a', 'b']);

**has() 、 hasIn()**
作用：判断是否存在某一个key 用法：
Immutable.fromJS([1,2,3,{a:4,b:5}]).has('0'); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).has('0'); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).hasIn([3,'b']) //true

**includes()**
作用：判断是否存在某一个value 用法：
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(2); //true
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes('2'); //false 不包含字符2
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(5); //false 
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes({a:4,b:5}) //false
Immutable.fromJS([1,2,3,{a:4,b:5}]).includes(Immutable.fromJS({a:4,b:5})) //true

**first() 、 last()**
作用：用来获取第一个元素或者最后一个元素，若没有则返回undefined

**设置** set()

**删除** delete


### immutable 原理

Immutable 实现的原理是 Persistent Data Structure（持久化数据结构），也就是使用旧数据创建新数据时，要保证旧数据同时可用且不变。同时为了避免 deepCopy 把所有节点都复制一遍带来的性能损耗，Immutable 使用了Structural Sharing（结构共享），即如果对象树中一个节点发生变化，只修改这个节点和受它影响的父节点，其它节点则进行共享。
