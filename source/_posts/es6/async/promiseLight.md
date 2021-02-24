---
title: Promise-红绿灯
category: es6
date: 2021-2-2
top: 96
---

题目：红灯三秒亮一次，绿灯一秒亮一次，黄灯2秒亮一次；如何让三个灯不断交替重复亮灯？（用 Promse 实现）

三个亮灯函数已经存在：

```js
function red(){
    console.log('red');
}
function green(){
    console.log('green');
}
function yellow(){
    console.log('yellow');
}
```
利用 then 和递归实现：

```js
let light = function(cb, time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      cb()
      resolve()
    }, time)
  })
}
let step = () => {
  Promise.resolve().then(() => {
    return light(red, 3000)
  }).then(() => {
    return light(green, 1000)
  }).then(() => {
    return light(yellow, 2000)
  }).then(() => {
    step()
  })
}
step()
```

