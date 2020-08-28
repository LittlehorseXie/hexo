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

// 
function defaultMemoize(func, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null
  let lastResult = null

  return function () {
    if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
      // 此处的arguments为 调用memoize(func)(a) 处的a 也就是memoize里层 return function() 处的传参
      console.log(3,arguments, lastArgs)
      lastResult = func.apply(null, arguments)
    }

    lastArgs = arguments
    return lastResult
  }
}

function createSelectorCreator(memoize, ...memoizeOptions) {
  // funcs 为 用户调用暴露的 createSelector 时的传参，调用后返回selector
  return (...funcs) => {
    let recomputations = 0
    // 获取用户传参的最后一项，也就是计算函数 
    const resultFunc = funcs.pop() // (a, b) => f(a,b)
    // pop后的funcs为计算函数的依赖项，判断依赖函数是否合法
    const dependencies = getDependencies(funcs) // [a => state.a, b => state.b]

    // 返回一个函数，
    const memoizedResultFunc = memoize(
      function () {
        recomputations++
        // null赋值给this，arguments传给resultFunc当参数
        console.log(1, arguments)
        return resultFunc.apply(null, arguments)
      },
      ...memoizeOptions
    )

    // If a selector is called with the exact same arguments we don't need to traverse our dependencies again.
    const selector = memoize(function () {
      const params = []
      const length = dependencies.length

      for (let i = 0; i < length; i++) {
        console.log(2, arguments)
        
        // apply arguments instead of spreading and mutate a local list of params for performance.
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

const createSelector = /* #__PURE__ */ createSelectorCreator(defaultMemoize)

function createStructuredSelector(selectors, selectorCreator = createSelector) {
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

function f (x, y) {
  return x+y
}
const fSelector = createSelector(state => state.a, state => state.b, (a, b) => f(a,b))
fSelector({a: 1, b: 2})
fSelector({a: 2, b: 2})