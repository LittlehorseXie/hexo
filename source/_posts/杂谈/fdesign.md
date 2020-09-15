---
title: Future-design
category: 杂谈
date: 2020-09-14 18:00
top: 98
---


## 1.0 遇到的问题

Question Reason Solution

Q：静态文件访问不了		
R：public目录放错位置了			
S：放到src/app/public下	

Q：本地启动成功、docker机启动不成功		
R：npm包安装有问题			
S：删除docker机上的node_modules，重新安装	

Q：docker机接口不更新		
R：接口报错时，会自己引用报错前未更改的接口内容		
S：解决当前错误		

Q：文件写入权限问题		
R：提前在当前项目里建一个projects的目录，用来build clone下来的项目
				
Q：静态文件不更新		
R：有缓存		
S：config里static的maxage设为0	
			
Q：线上部署模板时静态文件路径不正确
S：webpack的publicPath改成/public/${project_name}/static


## 2.0 遇到的问题

Q：将server文件中的object赋值写入到html中，一直报错 [object, object]
S：用JSON.stringify处理一下

Q：copy样式文件Json串的时候不能按照标准格式来
S：document.execCommand("Cut", false, null)，不过后来用了原来的copy也好了..莫名其妙

Q：开发环境中增加数据库表字段，不立即生效

Q:  线上页面502
S：后置命令reload

Q：线上新接口404
S：后置命令npm run stop & start

Q：线上所有接口502
S：npm start对应的端口需要和nginx配置的端口一样

Q: 线上访问docker机上的接口跨域（job、upload等）
S：nginx转发

Q: 往docker机上推代码推不上去
S: 中划线和下划线写错了，nginx大小有限制，在Nginx.conf的http里加 client_max_body_size 20m; 

Q: 线下npm run start失败
S: 线下不能访问线上数据库，需要更改config.prod连线下库（还要重新sh build.sh）

Q: 上传图片只显示半张
S:  stream流写入的时候需要监听finish之后再renturn，不然会强行中断


## 1.0 遗留问题

Q：对于模板的部署，目前是放在docker机下，但是一旦更新server代码重新build之后，dist的public会被覆盖掉	
S：在模板build之后将文件夹拷贝到src/app/public和dist/app/public中各一份，然后在package.json中配置，"midway-bin-build": {  "include": [  "app/public" ] }，这样server在build的时候就会拷贝src/app/public到dist/app/public中

Q：模板代码库地址问题，如果是其他人的地址，会因为权限问题clone不成功，但是fork到我个人地址下，会导致其他人查看不了，而且手动fork很low
S：建一个统一的存放模板的仓库，并且所有fe都有权限，在docker机上配置好git


## 2.0 已上线

- [x] uuap2.0登陆
- [x] 模板上传悬浮按钮入口
- [x] 模板管理列表页（模板上传、更改、下架）
    - [x] 上传图片接口
    - [x] 一键部署接口完善（详细错误信息提示）
    - [x] tag标签新增、删除
    - [x] 多项目并发测试 测了两个项目同时上传
    - [x] 对各种类型模板上传兼容
- [x] 部分接口调用docker机上的，nginx转发
    - [x] 上传图片接口 upload
    - [x] 和job相关的接口
- [x] 在线编辑变色方案完成
- [x] 权限校验
    - [x] 接口权限校验
    - [x] 管理员权限
    - [x] 普通用户只能更改自己上传的模板


## 3.0
- [ ] saas模板优化
    - [ ] 主题文件优化
    - [ ] 接口使用mockjs
- [ ] 对submodule支持
- [ ] 优化主题文件变量的类型判断
    - [ ] -color、-bg、-background  为颜色；
    - [ ] -height、-width、-radius、-size 为像素；-padding、-margin为四个像素
    - [ ] -border 为颜色； 因为可能是-border-radius，所以放在下面
    - [ ] copy主题文件的全部变量
    - [ ] 确定样式、交互
- [ ] 明确对开发者的约束，并写到模板上传页


## 变色方案调研


webpack-theme-color-replacer方案
webpack插件实现自动抽取css中的主题色样式，并一键动态切换主题色（element-ui）
https://github.com/hzsrc/ant-design-pro/commit/5e99cb1f95d1ec3190f436e2633baf007fcf22ee
https://github.com/sendya/ant-design-pro-vue/commit/c0a7ea199d5f3fe441b589ccc889713bf2f14845

less方案
antd-theme-generator
antd在线换肤定制功能 https://www.jianshu.com/p/b635211658c8

hsv hls rgb a