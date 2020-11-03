---
title: 【为什么】要用Redux toolkit
category: Redux
date: 2020-07-30 14:29
top: 97
---

通常情况下，我们使用常规redux来管理数据的话，需要经过以下步骤：
- 创建store
- Constants 声明 action type
- Actions 声明 action creator，需要引用 Constants
- Reducers 用于放拆分后的子 reducer，需要引用 Constants，各种switch来判断action type
- Selectors 用于取某个 redux state 的值
- tsx 文件需要引用Actions、Selectors
- 此外，还有创建 Services 声明 api 调用

光是看这些个英文单词，就觉得很繁琐了
redux核心库让我们来决定如何处理所有事情，比如store的启动、state里都包含什么、如何构建你的reducers
在某些场景，这是好的，因为它给我们提供了灵活性。但有时，我们只想用最简单的方式开始，有一些好的默认行为开箱即用。或许，你正在编写一个很大的应用程序，已经发现自己总是会写一些相似的代码，这时你想减少手写的代码量。

Redux Toolkit
就是帮我们来简化redux代码的。它并不是一个完整的解决方案，但它会使和Redux相关的代码变得更简单

rtk 是 mobx 作者的另一个优秀作品，让我们可以用 mutable 的写法处理 state，但是最后还是 immutable 的更新
集成了redux、redux-thunk、immer、reselect等工具

rtk 并不会改变redux的工作原理，我们仍创建一个Redux store，触发action的方式来描述“发生了什么”，并且通过reducer函数返回新的更新后的state

rtk 有利于所有 Redux 用户。无论您是设置第一个项目的 Redux 用户，还是希望简化现有应用程序的有经验的用户，Redux toolkit都可以帮助您更好的写 Redux 代码。


## 目的
Redux toolkit旨在成为编写redux逻辑的标准方式，它起初是为了解决redux常见的3个问题

- 配置一个redux store太复杂了
- 我必须添加很多packages才能配置好一整套redux
- Redux需要太多的样板代码

我们不能解决所有的case，像create-react-app一样，我们可以提供一些工具，解决一些常见的问题，简化用户代码
因此，toolkit小心的限制了这个范围，它并不涉及数据缓存、文件夹或文件结构、可重用封装的Redux module


## 暴露的api

下面我们看下rtk具体为我们带来了哪些方便：

```js
npm install @reduxjs/toolkit
yarn add @reduxjs/toolkit
```

## configureStore()
包装了 createStore 以提供简化的配置选项和良好的默认值，返回一个Redux store实例。它可以自动combine所有的slice reducers, 添加任何你需要的 Redux middleware , 默认包含了redux-thunk, 并启用 Redux DevTools 扩展.

传统redux:
```js
store = createStore(reducers)
```

redux-toolkit:
```js
Store = configureStore({
	reducer: reducers
})
```

这可能看起来没什么不同，但在内部，store已经配置了Redux DevTools扩展以查看dispatched actions历史和store state变更，并且默认引入了一些redux中间件

下面举一个稍微全面的例子：
```js
import { applyMiddleware, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunkMiddleware from 'redux-thunk'

import monitorReducersEnhancer from './enhancers/monitorReducers'
import loggerMiddleware from './middleware/logger'
import rootReducer from './reducers'

export default function configureStore(preloadedState) {
  const middlewares = [loggerMiddleware, thunkMiddleware]
  const middlewareEnhancer = applyMiddleware(...middlewares)

  const enhancers = [middlewareEnhancer, monitorReducersEnhancer]
  const composedEnhancers = composeWithDevTools(...enhancers)

  const store = createStore(rootReducer, preloadedState, composedEnhancers)

  return store
}
```

上面传统的redux中
- 传参方式是(rootReducer, preloadedState, enhancer)，很容易就忘了哪个传参传的是什么
- 中间件和增强器的配置有些繁琐
- Redux DevTools Extension文档需要配置一些东西，许多用户会直接从官方文档拷贝下来，代码不易读

下面用rtk的方式来改写，有以下优点：
- 传参为一个object，name可以方便的看出每个参数的含义
- 直接添加middleware和enhancers，自动帮用户调用applyMiddleware和compose
- 自动添加Redux DevTools Extension
除此之外，configureStore默认配置来一些中间件：
- redux-thunk来帮我们解决把异步逻辑放在component外面的问题
- 开发模式下，中间件帮我们检查是不是有使用mutate的方式改变state

这就意味着更简洁的store代码：
```js
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'

import monitorReducersEnhancer from './enhancers/monitorReducers'
import loggerMiddleware from './middleware/logger'
import rootReducer from './reducers'

export default function configureAppStore(preloadedState) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: [loggerMiddleware, ...getDefaultMiddleware()],
    preloadedState,
    enhancers: [monitorReducersEnhancer]
  })

  return store
}
```
reducer: rootReducer也可以写成reducer: {
  users: usersReducer,
  posts: postsReducer
}的形式，configureStore会自动调用combineReducers，此外，如果提供了middleware参数，configureStore就会只使用用户自己的赋值，如需添加rtk默认的，需要使用getDefaultMiddleware


## createAction()
接收一个action type字符串，返回一个action creator函数. 函数本身已定义 toString, 因此它用来代替type constant （能把Constants和Actions文件合成一个）

传统redux:
```js
// Constants文件
const INCREMENT = 'INCREMENT'
// actions文件
function incrementOriginal(text) {
  return {
    type: INCREMENT,
    payload: { text }
  }
}
console.log(incrementOriginal(111))
// {type: "INCREMENT", payload: {text: 111}}
```

redux-toolkit:
```js
// actions文件
const increment = createAction('INCREMENT')
console.log(increment({ text: 111 }))
// {type: "INCREMENT", payload: {text: 111}}
```

如果我们还需要在reducers使用action type字符串要怎么办？
createAction的返回的action creator函数，有一个toString方法（被重写的）可以返回action type，也可以直接调用.type
```js
console.log(increment.toString())
// "INCREMENT"
console.log(increment.type)
// "INCREMENT"
```

## createReducer()
接收一个initial state对象，和一个lookup table对象，返回reducer。这个lookup table对象的key是action type（因此我们可以利用es6的计算属性来创建key，自动调用toString()，省去了手动调用.type），value是函数。
此外, 它自动使用immer库使用户通过mutable的写法达到 immutable 更新的效果, 比如 state.todos[3].completed = true

传统redux:
```js
function counter(state = 0, action) {
  switch (action.type) {
    case INCREMENT:
      return state + 1
    case DECREMENT:
      return state - 1
    default:
      return state
  }
}
```
reducer会通过action type来判断触发一些逻辑，通常会使用switch语句。但是使用lookup table的方式来表现，可读性会更好

redux-toolkit:
```js
const counterReducer = createReducer(0, {
  [increment]: state => state + 1,
  [decrement]: state => state - 1
})
```
直接使用[increment]作为key，是因为它会默认调用increment.toString()，也就是会返回action type。需要注意的是 如果使用swicth语句不会自动执行toString，也就是直接使用 case increment: 是不行的，需要case increment.toString() 或 case increment.type
也可以用传统的逻辑来写reducer，比如一些for循环、switch语句。最常规的写法就是判断action.type，然后做一些逻辑处理，返回一个新state。此外，一个reducer也会提供一个默认state

此外，combineReducers里的Reducer引入方式稍有不同
// 传统redux的reducer
直接引用每个reducer文件的导出的reducer就行
// rtk
需要引用Slice导出的reducer

然后就是触发action时，action type的不同了

此外，最好不要使用connect传递的props. dispatch直接触发action，而是把action creators当做connect的第二个参数，直接通过props.actionCreator的方式触发

We can also try completely switching from the "folder-by-type" structure to a "feature folder" structure, by moving all of the component files into the matching feature folders.
* Remove unused action and reducer files
* Consolidate components into feature folders

Everyone has different preferences on what makes a "maintainable" folder structure, but overall that result looks pretty consistent and easy to follow.


## createSlice()

目前我们的代码长成这样：
```js
const increment = createAction('INCREMENT')
const decrement = createAction('DECREMENT')

const counter = createReducer(0, {
  [increment]: state => state + 1,
  [decrement]: state => state - 1
})

const store = configureStore({
  reducer: counter
})

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch(increment())
})
```

现在已经优化了一些了，但是我们还能再做一个重大改变。我们想避免单独创建这些action creators，而只想要突出重点部分—reducer函数

这也是createSlice的主要作用，它接收一个value为reducer function的object , slice name,和initial state value, 它会根据object的key自动生成slice reducer相关的 action creators和 action types

createSlice返回一个slice对象，包含了reducer函数和一个叫actions的对象包含了action creators函数

使用createSlice改进之后的代码如下：
```js
const counterSlice = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {
    increment: state => state + 1,
    decrement: state => state - 1
  }
})

const store = configureStore({
  reducer: counterSlice.reducer
})

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch(counterSlice.actions.increment())
})
```

推荐使用ES6语法解析出action creator函数和reducer：
```js
const { actions, reducer } = counterSlice
const { increment, decrement } = actions
```

总的来说，counterSlice在内部把createAction和createReducer结合起来又封装了一层

此外，slice到底什么？
一个普通的redux app在其状态树的顶层是一个js对象，该对象是一个调用Redux combineReducers函数将多个reducer函数组合到一个“ root reducer”中的结果。我们把这个对象的一个key value部分称为一个slice，我们通过slice reducer来表述reducer function的职责

比如在普通reducer的顶部，代码大概是这样：
```js
import todos from './todos'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
  todos,
  visibilityFilter
})
```

combined之后的state大概是{todos: [], visibilityFilter: "SHOW_ALL”}这种结构，state.todos就是一个slice，todos的reducer函数就是一个slice reducer

下面我们再举一个稍微复杂的例子：
```js
// 传统redux的reducer
const todos = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: action.id,
          text: action.text,
          completed: false
        }
      ]
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
      )
    default:
      return state
  }
}

export default todos
```
解析：
有个默认值[]
ADD_TODO时，通过复制了一遍state来实现新todo的
TOGGLE_TODO时，通过state.map的方式来实现状态更新
需要定义default来响应未命中的action type，来返回当前的state
导出todos reducer
（其实还有两个隐藏的步骤，从constant里倒入action type，因为action里也会用到action type；和声明action creator）

```js
// 用rtk的方式写
const todosSlice = createSlice({
	name: 'todos',
	initialState: [],
	reducer: {
		addTodo(state, action) { 
			const { id, text } = action.payload
			state.push({ id, text, completed: false }) 
		},
		toggleTodo(state, action) { 
			const todo = state.find(todo => todo.id === action.payload)
			if (todo) {
        todo.completed = !todo.completed
      }

		}
	}
})
export const { addTodo, toggleTodo } = todosSlice.actions
export default todosSlice.reducer
```

找不同：
不再需要单独的constant和actions文件，直接导出actions
不需要再定义default，自动处理所有的action type
用Mutable数据操作的方式更新state，比如state.push，这是因为createSlice和createReducer用Immer库封装了一层，使我们能用Mutable的方式来达到immutably更新的效果（这样不仅简化了操作，还让我们的意图变得更加清晰：往数组里push一项、更改某一项的completed状态）
最终todosSlice返回的是一个类似下面的object，把actions reducers写在一个文件里，需要什么导出什么，也就是“duck”模式
```js
{
  name: "todos",
  reducer: (state, action) => newState,
  actions: {
    addTodo: (payload) => ({type: "todos/addTodo", payload}),
    toggleTodo: (payload) => ({type: "todos/toggleTodo", payload})
  },
  caseReducers: {
    addTodo: (state, action) => newState,
    toggleTodo: (state, action) => newState,
  }
}
```
用ts来表示的话，也就是：
```js
{
  name : string,
  reducer : ReducerFunction,
  actions : Record<string, ActionCreator>,
  caseReducers: Record<string, CaseReducer>
}
```

需要注意的是：
action type并不是一个单独的slice的独占值，每一个slice reducer拥有其自己的Redux state，但是，也能监听任意action type并适当更新其状态，例如 响应用户注销操作以回初始状态值
如果两个模块尝试相互导入，JS 模块可能会出现"循环引用"问题。这可能导致导入未定义，可能会破坏需要该导入的代码。特别是在"duck"或slice的情况下，如果在两个不同的文件中定义的slice都希望响应另一个文件中定义的action，则可能会发生这种情况。

下面，我们看一下createSlice的完整传参：
```js
function createSlice({
    // A name, used in action types
    name: string,
    // The initial state for the reducer
    initialState: any,
    // An object of "case reducers". Key names will be used to generate actions.
    reducers: Object<string, ReducerFunction | ReducerAndPrepareObject>
    // A "builder callback" function used to add more reducers, or
    // an additional object of "case reducers", where the keys should be other
    // action types
    extraReducers?:
    | Object<string, ReducerFunction>
    | ((builder: ActionReducerMapBuilder<State>) => void)
})
```
可以发现reducers object还可以接收ReducerAndPrepareObject作为value，我们通过代码就可以快速了解这是做什么的：
```js
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import nanoid from 'nanoid'

interface Item {
  id: string
  text: string
}

const todosSlice = createSlice({
  name: 'todos',
  initialState: [] as Item[],
  reducers: {
    addTodo: {
      reducer: (state, action: PayloadAction<Item>) => {
        // reducer 就是普通的 ReducerFunction
        state.push(action.payload)
      },
      prepare: (text: string) => {
        // prepare 可以帮我们准备 action的payload
        const id = nanoid()
        return { payload: { id, text } }
      },
    },
  },
})
```

我们还发现，createSlice还有一个参数是`extraReducers`。如上面所说，每个slice reducer都拥有其slice里的state，但有时，slice需要依赖其他slice的状态，并作出一些响应。这时extraReducers就派上用场了
extraReducers里的action type，不会被当做slice.actions导出，也就是createSlice不会对extraReducers里的action type 调用 createAction 来自动创建action creators，它只会被当做一个slice reducer传到combineReducers里
当一个action type既在reducers里也在extraReducers出现，会由reducers处理

extraReducers的推荐使用方式是传入一个ActionReducerMapBuilder实例，`builder callback notation`也是唯一的方式来实现添加matcher reducer 和 default case reducer，并且它具有更好的TypeScript写法兼容

extraReducers的另外的常见用处还在于，处理createAction和createAsyncThunk（下面会讲）产生的action

具体使用方法如下：
```js
import { createAction, createSlice, Action, AnyAction } from '@reduxjs/toolkit'
const incrementBy = createAction<number>('incrementBy')
const decrement = createAction('decrement')

interface RejectedAction extends Action {
  error: Error
}

function isRejectedAction(action: AnyAction): action is RejectedAction {
  return action.type.endsWith('rejected')
}

createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // addCase 用来处理 一个确切的action type
      .addCase(incrementBy, (state, action) => {
        // action is inferred correctly here if using TS
      })
      // 直接链式调用即可
      .addCase(decrement, (state, action) => {})
      // addMatcher 用来处理 match匹配一系列action type
      .addMatcher(
        isRejectedAction,
        // `action` will be inferred as a RejectedAction due to isRejectedAction being defined as a type guard
        (state, action) => {}
      )
      // 可以声明一个defaultcase来处理没有匹配到的action
      .addDefaultCase((state, action) => {})
  },
})
```
除了builder callback notation的方式，还可以使用map object notation的方式来写extraReducers，也就是最常见的写reducers的方式。这时你需要使用actionCreator.type 或者 actionCreator.toString()来写ts
代码如下：

```js
const incrementBy = createAction('incrementBy')

createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {},
  extraReducers: {
    [incrementBy]: (state, action) => {
      return state + action.payload
    },
    'some/other/action': (state, action) => {}
  }
})
```

此外，actions有时需要传递一些data，此时应遵循Flux Standard Action-FSA标准，使action更规范、易读，即 把data放在payload里。
FSA标准：一个action是一个对象，必须有一个type（字符串）属性，可能有payload（任何类型） error（如果 action 的 error 属性是 true，则该 action 实际上表示对 Promise 进行 rejected，并且 payload 属性的值应当是一个错误对象） meta（任何类型，它旨在用于不属于 payload 的额外信息）属性，不能有其他属性

那么如何在rtk中添加带payload的action呢？createAction和createSlice都支持：

// createAction需要使用第二个参数
```js
let nextTodoId = 0
const addTodo = createAction('ADD_TODO', text => {
  return {
    payload: { id: nextTodoId++, text }
  }
})
```
注意：必须返回一个有payload属性的对象

// createSlice需要把reducers里之前action type对应的value，从reducer function变为一个对象，这个对象的reducer是之前的reducer function，prepare相当于payload
```js
let nextTodoId = 0
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: {
      reducer(state, action) {
        const { id, text } = action.payload
        state.push({ id, text, completed: false })
      },
      prepare(text) {
        return { payload: { text, id: nextTodoId++ } }
      }
    }
  }
}
```
// 如使用typescript，需要给initialState和action声明类型
// action类型需要使用@reduxjs/toolkit里的PayloadAction<PayloadType>
```js
interface IAddToDo {
	id?: number,
	text: string
}
setAState(state, action: PayloadAction<IAddToDo>) 
```
// 不需要再给上面代码的state赋类型，因为createSlice已经知道它和initialState的类型一样


// 单元测试
```js
describe('addTodo', () => {
  it('should generate incrementing todo IDs', () => {
    const action1 = addTodo('a')
    const action2 = addTodo('b')

    expect(action1.payload).toEqual({ id: 0, text: 'a' })
    expect(action2.payload).toEqual({ id: 1, text: 'b' })
  })
})
```


## createAsyncThunk
接收一个action type字符和一个返回promise的函数, 生成一个基于这个promise触发pending/fulfilled/rejected action types 的 thunk 

当我们想要把异步请求的逻辑和UI组件分开时，或者额外的逻辑进行多次dispatch或getState时，我们就需要用到thunk

使用普通redux时，经常按照类型来划分文件，比如actions文件夹下发那个所有的action，constants文件夹放所有的constant，但现在，我们只有slice文件，这样，我们可以把thunk直接放在slice文件里，这样也利于直接访问action

比如下面的代码：
```js
// First, define the reducer and action creators via `createSlice`
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    loading: 'idle',
    users: []
  },
  reducers: {
    usersLoading(state, action) {
      // Use a "state machine" approach for loading state instead of booleans
      if (state.loading === 'idle') {
        state.loading = 'pending'
      }
    },
    usersReceived(state, action) {
      if (state.loading === 'pending') {
        state.loading = 'idle'
        state.users = action.payload
      }
    }
  }
})

// Destructure and export the plain action creators
export const { usersLoading, usersReceived } = usersSlice.actions

// Define a thunk that dispatches those action creators
const fetchUsers = () => async dispatch => {
  dispatch(usersLoading())
  const response = await usersAPI.fetchAll()
  dispatch(usersReceived(response.data))
}
```
这样在请求数据的时候直接dispatch(fetchUsers())就可以了

如果用到了typescript，我们还需要声明thunk action的类型
```js
import { configureStore, Action } from '@reduxjs/toolkit'
import { ThunkAction } from 'redux-thunk'
import rootReducer, { RootState } from './rootReducer'

export type AppDispatch = typeof store.dispatch
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>

const fetchUsers = (): AppThunk  => async dispatch => {...}
```

thunk被进行了一些改造：
- thunk没有return任何东西
- getState的state类型，是RootState的类型
- 可以自定义 thunk 中间件以传递额外的值
- dispatch能接收任何type是字符串的action


除此之外，redux官方建议在请求异步数据时，做到以下步骤：
- 请求数据前，触发start action，以实现一些loading效果
- 请求数据
- 数据返回后，包含成功操作或者错误数据，并且结束loading，进行正常展示或错误提示

这就意味着每个请求都有三个额外的action type，用普通redux触发一个异步请求差不多是这样：

```js
const getRepoDetailsStarted = () => ({
  type: "repoDetails/fetchStarted"
})
const getRepoDetailsSuccess = (repoDetails) => {
  type: "repoDetails/fetchSucceeded",
  payload: repoDetails
}
const getRepoDetailsFailed = (error) => {
  type: "repoDetails/fetchFailed",
  error
}
const fetchIssuesCount = (org, repo) => async dispatch => {
  dispatch(getRepoDetailsStarted())
  try {
    const repoDetails = await getRepoDetails(org, repo)
    dispatch(getRepoDetailsSuccess(repoDetails))
  } catch (err) {
    dispatch(getRepoDetailsFailed(err.toString()))
  }
}
```

需要关注的是：
thunk目前虽然和slice在一个文件里，但其实是相互独立的声明，因为目前RTK没有将thunk定义为slice相关的特殊语法
thunk action creator是一个箭头函数，并且是AppThunk的类型
我们使用 thunk 函数本身的async/await 语法。这不是必需的，但async/await通常会比嵌套Promise.then() 更简洁
在thunk中，我们dispatch slice里创建的plain action creators

上面的错误处理还有一些问题
上面的try/catch能够捕获getRepoDetails时的报错，但也能捕获dispatch getRepoDetailsSuccess时的错误信息，这两种方式引发的错误捕获，都会触发dispatch getRepoDetailsFailed，这显然不太合理

为了解决上面的问题，我们可以通过promise来解决
```js
getRepoDetails(org, repo).then(
  // success callback
  repoDetails => dispatch(getRepoDetailsSuccess(repoDetails)),
  // error callback
  err => dispatch(getRepoDetailsFailed(err.toString()))
)
```
也可以改进一下try/catch包裹
```js
 let repoDetails
  try {
    repoDetails = await getRepoDetails(org, repo)
  } catch (err) {
    dispatch(getRepoDetailsFailed(err.toString()))
    return
  }
  dispatch(getRepoDetailsSuccess(repoDetails))
}
```
此外，还有几个有意思的地方：
start fetching和fetch failed的逻辑在很多地方都需要，因此我们可以把这个逻辑提炼出来，在需要的地方重用

createAsyncThunk抽象了这个模式，以自动触发这些操作

```js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { userAPI } from './userAPI'

// First, create the thunk
const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId, thunkAPI) => {
    const response = await userAPI.fetchById(userId)
    return response.data
  }
)

// Then, handle actions in your reducers:
const usersSlice = createSlice({
  name: 'users',
  initialState: { entities: [], loading: 'idle' },
  reducers: {
    // standard reducer logic, with auto-generated action types per reducer
  },
  extraReducers: {
    // Add reducers for additional action types here, and handle loading state as needed
    [fetchUserById.fulfilled]: (state, action) => {
      // Add user to the state array
      state.entities.push(action.payload)
    }
  }
})

// Later, dispatch the thunk as needed in the app
dispatch(fetchUserById(123))
```

## createEntityAdapter
生成一组可重用的 reducers 和 selectors 以便管理store里的 规范化数据

参考：
https://www.redux.org.cn/docs/recipes/reducers/NormalizingStateShape.html
https://redux-toolkit.js.org/usage/usage-guide#managing-normalized-data

## createSelector 
直接从Reselect 库中导出的

除以上api，rtk还导出了一些它内部使用到的工具函数，比如：

nanoid：生成非加密安全的随机 ID 字符串。用于 createAsyncThunk 请求 ID时自动调用，但也可能适用于其他情况。
createNextState：从immer库中导出
current：从immer库中导出，生成当前状态的一份快照，在调试时经常用到，比如在reducer中console.log(current(state))
combineReducers：从redux中导出
compose：从redux中导出
bindActionCreators：从redux中导出
createStore：从redux中导出
applyMiddleware：从redux中导出

## 总的来说

传统redux:
代码通过 "folder-by-type" structure的方式书写, 比如actions 和 reducers都是独立的文件
React组件可能使用“container / presentational”模式的严格版本编写，其中“ presentational”组件位于一个文件夹中，而Redux“ container”连接定义位于另一个文件夹中
有些代码未遵循某些推荐的Redux“最佳实践”模式


## 一些注意点
Rtk使用Mutable的方式来处理数据，其内部自动使用了immer，但在普通redux时这么使用是不可的
slice导出的action type、reducer最好约束好明明规范，让大家一眼就能看出这是个action、这是个reducer。同理还有type interface声明。这点reselect可以直接规范为selectX
也可以借助react hooks — useDispatch useSelector来辅助redux使用，以代替connect 和 mapDispatch的用法
Redux-toolkit只是结合了一些“最佳实践”，而不是一个redux中间件（当然了，从api能看出来，没有中间件是可以直接涉及store创建的；此外，从它能干这么多事也能看出来，理论上一个中间件应该只做一件事）



