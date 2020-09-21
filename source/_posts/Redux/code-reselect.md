---
title: 【代码分析】reselect
category: Redux
date: 2020-08-24 15:37
top: 65
---

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