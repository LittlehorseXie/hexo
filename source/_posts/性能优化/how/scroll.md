---
title: 优化之滚动篇
category: 性能优化
description: 滚动其实包含在了 scroll 和 resize 两个行为中
top: 77
---


### 为什么要进行滚动优化？

用户的 scroll 和 resize 行为会导致浏览器不断的重新渲染。

scroll 事件本身会触发页面的重新渲染，同时 scroll 事件的 handler 又会被高频度的触发, 因此事件的 handler 内部不应该有复杂操作，例如 DOM 操作就不应该放在事件处理中。

针对此类高频度触发事件问题（例如页面 scroll ，屏幕 resize，监听用户输入等），下面介绍两种常用的解决方法，防抖和节流。

### 防抖（debouncing）

**任务频繁触发的情况下，只有任务触发的间隔超过指定间隔的时候，任务才会执行。**

```javascript
function debounce(fn, time){
    let timeout = null;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn.apply(this, arguments);
        }, time);
    };
}

function sayDebounce()
    console.log('防抖');
}

// 事件监听
window.addEventListener('scroll', debounce(sayDebounce, 500));
```

### 节流（throttle）

**指定时间间隔内只会执行一次任务。**

防抖函数确实不错，但是也存在问题，譬如图片的懒加载，我希望在下滑过程中图片不断的被加载出来，而不是只有当我停止下滑时候，图片才被加载出来。

这个时候，我们希望即使页面在不断被滚动，但是滚动 handler 也可以以一定的频率被触发（譬如 250ms 触发一次），这类场景，就要用到另一种技巧，称为节流函数（throttling）。

```javascript
function throttle(fn, time) {
    let timeout,
        startTime = new Date();
        
    return function() {
        clearTimeout(timeout);
        let curTime = new Date();
        if (curTime - startTime >= time) {
            fn.apply(this, arguments);
            startTime = curTime;
        } else {
            timeout = setTimeout(fn, time);
        }
    }
}

function sayThrottle() {
    console.log('节流');
}

// 事件监听
window.addEventListener('scroll', throttle(sayThrottle, 500));
```

### **使用 rAF（requestAnimationFrame）触发滚动事件**

window.requestAnimationFrame\(\) 这个方法是用来在页面重绘之前，通知浏览器调用一个指定的函数。这个方法接受一个函数为参，该函数会在重绘前调用。

rAF 常用于 web 动画的制作，用于准确控制页面的帧刷新渲染，让动画效果更加流畅，当然它的作用不仅仅局限于动画制作，我们可以利用它的特性将它视为一个定时器。（当然它不是定时器）

通常来说，rAF 被调用的频率是每秒 60 次，也就是 1000/60 ，触发频率大概是 16.7ms 。（当执行复杂操作时，当它发现无法维持 60fps 的频率时，它会把频率降低到 30fps 来保持帧数的稳定。）

简单而言，使用 requestAnimationFrame 来触发滚动事件，相当于上面的：

```javascript
throttle(func, 1000/60) //xx 代表 xx ms内不会重复触发事件 handler
```

使用 requestAnimationFrame 优缺点并存，首先我们不得不考虑它的兼容问题，其次因为它只能实现以 16.7ms 的频率来触发，代表它的可调节性十分差。但是相比 throttle\(func, xx, 16.7\) ，用于更复杂的场景时，rAF 可能效果更佳，性能更好。

### **简化 scroll 内的操作**

上面介绍的方法都是如何去优化 scroll 事件的触发，避免 scroll 事件过度消耗资源的。

但是从本质上而言，我们应该尽量去精简 scroll 事件的 handler ，将一些变量的初始化、不依赖于滚动位置变化的计算等都应当在 scroll 事件外提前就绪。

#### **避免在scroll 事件**中修改样式属性 / **将样式操作从 scroll 事件中剥离。**

### **滑动过程中尝试使用 pointer-events: none 禁止鼠标事件**

pointer-events: none ****会禁止鼠标行为，应用了该属性后，譬如鼠标点击，hover 等功能都将失效，即是元素不会成为鼠标事件的 target。

那么它对滚动有什么用呢？

pointer-events: none 可用来提高滚动时的帧频。的确，当滚动时，鼠标悬停在某些元素上，则触发其上的 hover 效果，然而这些影响通常不被用户注意，并多半导致滚动出现问题。对 body 元素应用 pointer-events: none ，禁用了包括 hover 在内的鼠标事件，从而提高滚动性能。

上面说 pointer-events: none 可用来提高滚动时的帧频 的这段话摘自 [pointer-events-MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/pointer-events) ，还专门有文章讲解过这个技术：

[使用pointer-events:none实现60fps滚动](https://www.thecssninja.com/javascript/pointer-events-60fps) 。

这就完了吗？没有，张鑫旭有一篇专门的文章，用来探讨 pointer-events: none 是否真的能够加速滚动性能，并提出了自己的质疑：

[pointer-events:none提高页面滚动时候的绘制性能？](http://www.zhangxinxu.com/wordpress/2014/01/pointer-events-none-avoiding-unnecessary-paints/)

结论见仁见智，使用 pointer-events: none 的场合要依据业务本身来定夺，拒绝拿来主义，多去源头看看，动手实践一番再做定夺。

