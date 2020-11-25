---
title: 处理文件下载
category: 杂谈
date: 2020-11-25
top: 89
---

> 兼容windows系统 49 65 80+ 版本Chrome

## ROUND1

`代码`：
```ts
window.location.href = 'xxx'
```

`正常情况`：当前页面直接下载1份文件
`兼容问题`：导出2份文件，页面url变为文件地址，页面白屏，


## ROUND2

`思路`：window.location.href可能低版本chrome兼容不好
`解决方案`：使用创建a标签
`代码`：
```ts
const downloadFile = (fileUrl: string) => {
  var a = document.createElement('a');
  a.href = fileUrl;
  a.download = '';
  a.click();
}
```
`兼容问题`：有时会下载一个html文件


## ROUND3

`思路`：以为还是前端兼容性或者content-type问题，还让后端查了查
`解决方案`：（耗时很久）发现点一下控制台或者其他按钮就不再复现html了，所以加了个dom click
`代码`
```ts
const downloadFile = (fileUrl: string) => {
  const root = document.getElementById('root')
  root && root.click && root.click()
  let a = document.createElement("a");
  a.href = fileUrl;
  a.download = "";
  a.click();
};
```
`兼容问题`：发现错了...还是会下html

## ROUND4

`思路`：还是各种尝试api兼容，直到（耗时很久很久）才发现html里有一段内容包含了内网登陆认证的ip (下边用x.x.x.x替换了)，所以是被网络劫持了

`解决方案`：使用https（采用） 或 userAgent代理
`代码`：
```ts
const downloadFile = (fileUrl: string) => {
  const hasProtocol = /http[s]{0,1}:\/\/([\w.]+\/?)\S*/.test(fileUrl)
  let a = document.createElement("a");
  if (!hasProtocol && window.location.origin === 'http://sds.sf-express.com') {
    a.href = 'https://sds.sf-express.com' + fileUrl
  } else {
    a.href = fileUrl;
  }
  a.download = "";
  a.click();
};
```
`兼容问题`：页面会出现一个“您的连接不是私密链接”


## ROUND5

`思路`：这时候肯定是https的问题了，需要确认什么时候会导致chrome出现这个页面
`兼容问题`：这时候有人又报点击下载页面没反应

## ROUND6.1

`思路`：兼容问题，但是小黑本上的65 86版本Chrome都没问题，问了当事人是49版本的，所以先下载49版本，再复现，但是（耗时很久）没找到适合win10、win7的49版本
`解决方案`：使用接近49版本的firefox52来复现，真的成功了（喜极而泣😹）

## ROUND6.2

`小插曲`：其实还有个小插曲，是业务用的是内网，需要业务的IT把网址需要的ip添加到配置里

## 最终代码实现

`注意点`：
1. 为兼容低版本Chrome，一定要把DOM添加到body里 
2. appendChild和removeChild，不是append和remove

```ts
const downloadFile = (fileUrl: string) => {
  try {
    let a = document.createElement("a");
    let url = fileUrl
    const hasProtocol = /http[s]{0,1}:\/\/([\w.]+\/?)\S*/.test(fileUrl)
    if (!hasProtocol && window.location.origin === 'http://sds.sf-express.com') {
      url = 'https://sds.sf-express.com' + fileUrl
    }
    a.setAttribute('href', url)
    a.setAttribute('download', '')
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a)
  } catch {
    window.open(fileUrl)
  }
};
```


## 复盘浪费时间的节点和当时困在里面的思路

1. 得知导出html时，一直以为兼容问题或者content-type问题，没有具体详细看html内容是啥
2. 得知html解决了，但是有些人点下载没反应时，一直在想着安装chrome49，还借了个win7，一开始没想到想找一个内核差不多的浏览器复现一下，能复现出来就差不多是差不多的兼容（草了，就因为这，午饭没吃上火锅）

## 破案

> 只有线上域名会触发劫持

### 1. 为什么一开始下载两个文件，且白屏
【见html1】【window.location.href】默认触发下载1个文件，然后被网络劫持，页面dom变成html1文件内容，白屏，触发setTimeout，过了2s下载第2个文件

### 2. 为什么后边会偶尔下载成html文件
【见html2】【创建a标签 触发click】被网络劫持，把要下载的文件变成了html

### 3. 什么时候会触发“您的连接不是私密链接”
猜测是业务的内网服务配置有一些问题，需要把对应的ip配置进去



## 两个肥肠重要的html文件

### 1 location.href打开白屏时的html
```html
<html>
  <head>
    <script language="javascript">setTimeout("location.replace(location.href.split(\"#\")[0])",2000);</script>
    <script type="text/javascript" src="http://x.x.x.x:x/cookie/flash.js"></script>
    <script language="javascript">setURL("x.x.x.x");supFlash("3704792069");</script>
  </head>
</html>
```

### 2 本应该下载csv文件却下载了的html文件
```html
<html>
  <head>
    <script language="javascript">setTimeout("location.replace(location.href.split(\"#\")[0])",2000);</script>
    <script type="text/javascript" src="http://x.x.x.x:x/cookie/flash.js"></script>
    <script language="javascript">setURL("x.x.x.x");supFlash("3638041167");</script>
  </head>
  <body>
    <object classid="clsid:xxxxxxxxxx" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" width="0" height="0" id="m" align="center"><param name="allowScriptAccess" value="always" />
    <param name="movie" value="http://x.x.x.x:x/cookie/flashcookie.swf" />
    <param name="quality" value="high" />
    <param name="FlashVars" value="srv=x.x.x.x" />
    <embed src="http://x.x.x.x:x/cookie/flashcookie.swf"FlashVars="srv=x.x.x.x" quality="high" width="0" height="0"  name="m" align="center" allowScriptAccess="always" type="application/x-shockwave-flash"pluginspage="http://www.macromedia.com/go/getflashplayer" />
    </object>
  </body>
</html>
```