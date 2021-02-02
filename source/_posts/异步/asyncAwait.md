---
title: ES7 中引入 async-await
category: 异步
date: 2020-12-19
top: 90
---


可以理解为是Generator的语法糖

async function代替了function*，await代替了yield，其他的再没有什么区别了。哦，还有，使用async-await时候不用再引用co这种第三方库了，直接执行即可


await后面必须跟一个Promise对象，跟其他类型的数据也OK，但是会直接同步执行，而不是异步。

返回的是个Promise对象


## 异步操作代码的变化

最后我们来感受一下，从一开始callback方式到后来的async-await方式，前前后后编写异步代码的变化。从变化中就可以体会到，确实越来越简洁，越来越易读。

### callback方式

```js
fs.readFile('some1.json', (err, data) => {
    fs.readFile('some2.json', (err, data) => {
        fs.readFile('some3.json', (err, data) => {
            fs.readFile('some4.json', (err, data) => {

            })
        })
    })
})
```

### Promise方式

```js
readFilePromise('some1.json').then(data => {
    return readFilePromise('some2.json')
}).then(data => {
    return readFilePromise('some3.json')
}).then(data => {
    return readFilePromise('some4.json')
})
```

### Generator方式

```js
co(function* () {
    const r1 = yield readFilePromise('some1.json')
    const r2 = yield readFilePromise('some2.json')
    const r3 = yield readFilePromise('some3.json')
    const r4 = yield readFilePromise('some4.json')
})
```

### async-await方式

```js
const readFileAsync = async function () {
    const f1 = await readFilePromise('data1.json')
    const f2 = await readFilePromise('data2.json')
    const f3 = await readFilePromise('data3.json')
    const f4 = await readFilePromise('data4.json')
}
```

## async 与 Promise

严谨的说，async 是一种语法，Promise 是一个内置对象，两者并不具备可比性，更何况 async 函数也返回一个 Promise 对象……

这里主要是展示一些场景，使用 async 会比使用 Promise 更优雅的处理异步流程。

### 1. 代码更加简洁

```js
function fetch() {
  return (
    fetchData()
    .then(value1 => {
      return fetchMoreData(value1)
    })
    .then(value2 => {
      return fetchMoreData2(value2)
    })
  )
}

async function fetch() {
  const value1 = await fetchData()
  const value2 = await fetchMoreData(value1)
  return fetchMoreData2(value2)
};
```

### 2. 错误处理

```js
function fetch() {
  try {
    fetchData()
      .then(result => {
        const data = JSON.parse(result)
      })
      .catch((err) => {
        console.log(err)
      })
  } catch (err) {
    console.log(err)
  }
}
```
在这段代码中，try/catch 能捕获 fetchData() 中的一些 Promise 构造错误，但是不能捕获 JSON.parse 抛出的异常，如果要处理 JSON.parse 抛出的异常，需要添加 catch 函数重复一遍异常处理的逻辑。

在实际项目中，错误处理逻辑可能会很复杂，这会导致冗余的代码。

```js
async function fetch() {
  try {
    const data = JSON.parse(await fetchData())
  } catch (err) {
    console.log(err)
  }
};
```
async/await 的出现使得 try/catch 就可以捕获同步和异步的错误。

## async 地狱

async 地狱主要是指开发者贪图语法上的简洁而让原本可以并行执行的内容变成了顺序执行，从而影响了性能，但用地狱形容有点夸张了点

```js
(async () => {
  const listPromise = await getList();
  const anotherListPromise = await getAnotherList();

  // do something

  await submit(listData);
  await submit(anotherListData);

})();
```

因为 await 的特性，整个例子有明显的先后顺序，然而 getList() 和 getAnotherList() 其实并无依赖，submit(listData) 和 submit(anotherListData) 也没有依赖关系，那么对于这种例子，我们该怎么改写呢？

```js
async function handleList() {
  const listPromise = await getList();
  // ...
  await submit(listData);
}

async function handleAnotherList() {
  const anotherListPromise = await getAnotherList()
  // ...
  await submit(anotherListData)
}

// 方法一
(async () => {
  const handleListPromise = handleList()
  const handleAnotherListPromise = handleAnotherList()
  await handleListPromise
  await handleAnotherListPromise
})()

// 方法二
(async () => {
  Promise.all([handleList(), handleAnotherList()]).then()
})()

// 方法一 改写
async function loadData(urls) {
  // 并发读取 url
  const textPromises = urls.map(async url => {
    const response = await fetch(url);
    return response.text();
  });

  // 按次序输出
  for (const textPromise of textPromises) {
    console.log(await textPromise);
  }
}
```

## async 错误捕获

尽管我们可以使用 try catch 捕获错误，但是当我们需要捕获多个错误并做不同的处理时，很快 try catch 就会导致代码杂乱，就比如：

```js
async function asyncTask(cb) {
  try {
    const user = await UserModel.findById(1);
    if(!user) return cb('No user found');
  } catch(e) {
    return cb('Unexpected error occurred');
  }

  try {
    const savedTask = await TaskModel({userId: user.id, name: 'Demo Task'});
  } catch(e) {
    return cb('Error occurred while saving task');
  }

  if(user.notificationsEnabled) {
    try {
      await NotificationService.sendNotification(user.id, 'Task Created');
    } catch(e) {
      return cb('Error while sending notification');
    }
  }

  if(savedTask.assignedUser.id !== user.id) {
    try {
      await NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you');
    } catch(e) {
      return cb('Error while sending notification');
    }
  }

  cb(null, savedTask);
}
```
为了简化这种错误的捕获，我们可以给 await 后的 promise 对象添加 catch 函数，为此我们需要写一个 helper:

```js
// to.js
export default function to(promise) {
  return promise.then(data => {
    return [null, data];
  })
  .catch(err => [err]);
}
```
整个错误捕获的代码可以简化为：

```js
import to from './to.js';

async function asyncTask() {
  let err, user, savedTask;

  [err, user] = await to(UserModel.findById(1));
  if(!user) throw new CustomerError('No user found');

  [err, savedTask] = await to(TaskModel({userId: user.id, name: 'Demo Task'}));
  if(err) throw new CustomError('Error occurred while saving task');

  if(user.notificationsEnabled) {
    const [err] = await to(NotificationService.sendNotification(user.id, 'Task Created'));
    if (err) console.error('Just log the error and continue flow');
  }
}
```

## async 的一些讨论

### async 会取代 Generator 吗？
Generator 本来是用作生成器，使用 Generator 处理异步请求只是一个比较 hack 的用法，在异步方面，async 可以取代 Generator，但是 async 和 Generator 两个语法本身是用来解决不同的问题的。

### async 会取代 Promise 吗？
async 函数返回一个 Promise 对象

面对复杂的异步流程，Promise 提供的 all 和 race 会更加好用

Promise 本身是一个对象，所以可以在代码中任意传递

async 的支持率还很低，即使有 Babel，编译后也要增加 1000 行左右。
