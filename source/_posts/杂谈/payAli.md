---
title: h5对接支付宝
category: 杂谈
date: 2021-2-24
top: 84
---

## 
 
|       |         |       ios	     |           安卓          |
|-------|---------|----------------|------------------------|
| 支付宝 | 支付完成 |	✅ 返回订单详情页 | 自动转https，无法线下代理 |
|       | 中途退出 | ❌ 返回支付宝首页 | 自动转https，无法线下代理 |
| 浏览器 | 支付完成	| ❌ 返回支付宝首页 | ✅ 返回订单详情页         |
|       | 中途退出 | ❌ 返回支付宝首页	| ✅ 返回支付宝h5页面       |


https://opendocs.alipay.com/open/203/105288
![](../../assets/杂谈/aliPay.png)

https://myjsapi.alipay.com/alipayjsapi/util/pay/tradePay.html