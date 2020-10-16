---
title: 切分支时自动切换rd环境
category: 杂谈
date: 2020-10-16 15:33
top: 90
---

### start.js

```js
// eslint-disable-next-line
const express = require('express');
const webpack = require('webpack');
const path = require('path');
const watch = require('node-watch');

// eslint-disable-next-line
const proxy = require('http-proxy-middleware');
// eslint-disable-next-line
const webpackHotMiddleware = require('webpack-hot-middleware');
// eslint-disable-next-line
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../config/webpack.dev.config');


const apiList = ['/user', '/srm', '/sds', '/sdsdata'];

const proxyTo = (dev) => {
  apiList.forEach((api) => {
    // eslint-disable-next-line no-use-before-define
    app.use(api, proxy({ target: dev, changeOrigin: true }));
  });
};

const app = express();
const { dev } = require('./proxy.js');

proxyTo(dev);


function proxyClear(idxTag) {
  // eslint-disable-next-line no-underscore-dangle
  const { stack } = app._router;
  let idx = null;
  const itemList = [];
  // eslint-disable-next-line no-plusplus
  for (let i = stack.length - 1; i >= 0; i--) {
    const item = stack[i];
    let testTag = false;
    if (!item.regexp.test('/')) {
      apiList.forEach((api) => {
        if (item.regexp.test(api)) {
          testTag = true;
        }
      });
    }
    if (item.name === 'middleware' && testTag && !item.regexp.fast_star && !item.regexp.fast_slash) {
      const a = stack.splice(i, 1);
      if (idxTag) {
        itemList.push(a[0]);
      } else {
        idx = i;
      }
    }
  }
  if (idxTag) {
    // eslint-disable-next-line no-plusplus
    for (let i = itemList.length - 1; i >= 0; i--) {
      stack.splice(idxTag, 0, itemList[itemList.length - 1 - i]);
    }
  }
  return idx;
}

watch('./scripts/proxy.js', { recursive: true }, () => {
  console.log('重启proxy...\n');
  try {
    const { dev } = require('./proxy.js');
    const idx = proxyClear();  // 记录符合条件的中间件的最小下标，且删除这些中间件
    proxyTo(dev); // 添加中间件
    isNumber(idx) && proxyClear(idx); // 从最后一个符合条件的中间件 把它添加到idx坐标上
    console.log('\n重启proxy完成.\n');
  } catch (error) {
    console.log('\n重启出错，请查看proxy.js 解决文件冲突! \n');
  }
});


const compiler = webpack(webpackConfig);

const devServerOptions = Object.assign({}, webpackConfig.devServer, {
  logLevel: 'warn',
  publicPath: '/',
  silent: true,
  stats: 'errors-only',
});

const middleware = webpackDevMiddleware(compiler, devServerOptions);
app.use(middleware);
app.use(webpackHotMiddleware(compiler));

// 静态资源处理
const staticPath = '/static';
app.use(staticPath, express.static('./static'));

const fs = middleware.fileSystem;

app.get('*', (req, res) => {
  fs.readFile(path.join(compiler.outputPath, 'static/index.html'), (err, file) => {
    if (err) {
      res.sendStatus(404);
    } else {
      res.send(file.toString());
    }
  });
});

const customHost = process.env.HOST;
const host = customHost || null;

const port = 8082;
app.listen(port, host, () => {
  console.log(`Starting server on http://localhost:${port}`);
});
```

### proxy.js
```js
/* eslint-disable no-unused-vars */
delete require.cache[module.filename];

const rd1 = 'http://ip:port/';
const rd2 = 'http://ip:port/';

module.exports = {
  dev: rd1,
};
```
