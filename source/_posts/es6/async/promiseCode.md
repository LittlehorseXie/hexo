---
title: Promise代码实现
category: es6
date: 2021-3-9
top: 97
---

```js
const isFunction = fn => typeof fn === 'function'

class APromise {
  constructor(callback) {
    this.status = 'pending'
    this.value = undefined
    this.fulfilledCbList = []
    this.rejectedCbList = []

    const resolve = value => {
      if (this.status !== 'pending') {
        return
      }
      setTimeout(() => {
        this.value = value
        this.status = 'fulfilled'
        for (const fn of this.fulfilledCbList) {
          fn(this.value)
        }
      }, 0)
    }
    const reject = reason => {
      if (this.status !== 'pending') {
        return
      }
      setTimeout(() => {
        this.value = reason
        this.status = 'rejected'
        for (const fn of this.rejectedCbList) {
          fn(this.value)
        }
      }, 0)
    }

    try{
      callback(resolve, reject)
    } catch(err) {
      reject(err)
    }
  }

  
  then(onResolve, onReject) {
    if (this.status === 'pending') {
      const promise = new APromise((resolve, reject) => {
        onReject = isFunction(onReject) ? onReject : reason => { throw reason }
        onResolve = isFunction(onResolve) ? onResolve : value => { return value }
        this.fulfilledCbList.push((preValue) => {
          try {
            const value = onResolve(preValue)
            doThenFunc(promise, value, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
        this.rejectedCbList.push((preValue) => {
          try {
            const value = onReject(preValue)
            doThenFunc(promise, value, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      })
      return promise
    } else {
      const promise = new APromise((resolve, reject) => {
        try {
          const value = this.status === 'fulfilled' ? onResolve(this.value) : onReject(this.value)
          doThenFunc(promise, value, resolve, reject)
        } catch (err) {
          reject(err)
        }
      })
      return promise
    }
  }
  catch(onReject) {
    this.then(null, onReject)
  }
  static resolve(res) {
    return new APromise((resolve) => {
      resolve(res)
    })
  }
  static reject(res) {
    return new APromise((resolve, reject) => {
      reject(res)
    })
  }
  all(promises) {
    if (!Array.isArray(promises)) {
      return APromise.reject(new TypeError('args must be an array'))
    }
    const result = [] // 用于存储每个 promise 对象的结果
    const length = promises.length
    let count = 0
    return new APromise((resolve, reject) => {
      for(let index in promises) {
        promises[index].then(res => {
          result[index] = res
          if (++count === length) {
            resolve(res)
          }
        }, reason => {
          reject(reason)
        })
      }
    })
  }
  race(promises) {
    if (!Array.isArray(promises)) {
      return APromise.reject(new TypeError('args must be an array'))
    }
    return new APromise((resolve, reject) => {
      for(let index in promises) {
        promises[index].then(res => {
          resolve(res)
        }, reason => {
          reject(reason)
        })
      }
    })
  }
}

APromise.deferred = () => {
  let defer = {};
  defer.promise = new Promise((resolve, reject) => {
      defer.resolve = resolve
      defer.reject = reject
  });
  return defer;
}

function doThenFunc(promise, value, resolve, reject) {
  if (promise === value) {
    reject(new TypeError('循环调用'))
    return
  }
  if (value instanceof APromise) {
    value.then(val => {
      doThenFunc(promise, val, resolve, reject)
    }, reason => {
      reject(reason)
    })
    return
  }
  resolve(value)
}

module.exports = APromise

// 测试 
// npm i -g promises-aplus-tests
// promises-aplus-tests promise.js 
```