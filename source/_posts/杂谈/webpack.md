---
title: 关于webpack的一些问题
category: 杂谈
date: 2020-11-23
top: 95
---

1. url-loader 和 file-loader 

都用于处理图片资源
主要区别在于 url-loader可以设置图片大小限制，当超过限制时，其表现等同于file-loader；不超过限制时，则会将图片以base64的形式打包，以减少请求次数

```js
{
  loader: "url-loader",
  options: {
    // Inline files smaller than 10 kB
    limit: 10 * 1024,
    name: "static/assets/[name].[ext]",
    // 如果需要还可设置 publicPath
  },
}
```