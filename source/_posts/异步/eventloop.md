



> * javascript是一门单线程语言
> * Event Loop是javascript的执行机制




观察下面代码的执行顺序
```
    console.log(1)
    
    setTimeout(function(){
        console.log(2)
    },0)

    console.log(3)
```
    
运行结果是: 1 3 2
也就是说,setTimeout里的函数并没有立即执行,而是延迟了一段时间,满足一定条件后,才去执行的,这类代码,我们叫异步代码。
所以,这里我们首先知道了JS里的一种分类方式,就是将任务分为: 同步任务和异步任务

我们猜测JS的执行机制是

* 首先判断JS是同步还是异步,同步就进入主线程,异步就进入event table
* 异步任务在event table中注册函数,当满足触发条件后,被推入event queue
* 同步任务进入主线程后一直执行,直到主线程空闲时,才会去event 

queue中查看是否有可执行的异步任务,如果有就推入主线程中
以上三步循环执行,这就是event loop

上面关于event loop就是我对JS执行机制的理解,直到我遇到了下面这段代码

 setTimeout(function(){
     console.log('定时器开始啦')
 });
 
 new Promise(function(resolve){
     console.log('马上执行for循环啦');
     for(var i = 0; i < 10000; i++){
         i == 99 && resolve();
     }
 }).then(function(){
     console.log('执行then函数啦')
 });
 
 console.log('代码执行结束');
    
尝试按照,上文我们刚学到的JS执行机制去分析，结果是 【马上执行for循环啦 --- 代码执行结束 --- 定时器开始啦 --- 执行then函数啦】吗?

亲自执行后,结果居然不是这样,而是【马上执行for循环啦 --- 代码执行结束 --- 执行then函数啦 --- 定时器开始啦】

事实上,按照异步和同步的划分方式,并不准确。而准确的划分方式是:

* macro-task(宏任务)：包括整体代码script，setTimeout，setInterval
* micro-task(微任务)：Promise，process.nextTick



这段setTimeout代码什么意思? 我们一般说: 3秒后,会执行setTimeout里的那个函数
 setTimeout(function(){
    console.log('执行了')
 },3000)    
但是这种说并不严谨,准确的解释是: 3秒后,setTimeout里的函数被会推入event queue,而event queue(事件队列)里的任务,只有在主线程空闲时才会执行。
所以只有满足 (1)3秒后 (2)主线程空闲,同时满足时,才会3秒后执行该函数
如果主线程执行内容很多,执行时间超过3秒,比如执行了10秒,那么这个函数只能10秒后执行了


练习1

```
console.log('======== main task start ========'); // 1
new Promise(resolve => {
    console.log('create micro task 1'); // 2
    resolve();
}).then(() => {
    console.log('micro task 1 callback'); // 微1.1 6
    setTimeout(() => {
        console.log('macro task 3 callback'); // 宏2 12
    }, 0);
})

console.log('create macro task 2'); // 3
setTimeout(() => { // 宏1
    console.log('macro task 2 callback'); // 8
    new Promise(resolve => {
        console.log('create micro task 3'); // 9
        resolve();
    }).then(() => {
        console.log('micro task 3 callback'); // 微1.3 11
    })
    console.log('create macro task 4'); // 10
    setTimeout(() => {
      console.log('macro task 4 callback'); // 宏3 13
    }, 0);
}, 0);

new Promise(resolve => {
  console.log('create micro task 2'); // 4
  resolve();
}).then(() => {
  console.log('micro task 2 callback'); // 微1.2 7
})

console.log('======== main task end ========'); // 5
```

练习2

```
async function async1() {
    console.log('async1 start') // 2
    await async2()
    console.log('async1 async2') // 微1.1 6
    await async3()
    console.log('async1 async3') // 微1.3 9
    const a = await async4()
    console.log(a)
}

async function async2() {
    console.log('async2') // 3 
}
async function async3() {
    console.log('async3') // 7 
}
async function async4() {
    console.log('async4') // 10 
    return new Promise(resolve => {
        setTimeout(() => resolve('async4 setTimeout'), 0) // 12 
    })
}

console.log('script start') // 1 

setTimeout(function() { // 宏1
    console.log('setTimeout') // 11
}, 0)

async1()

new Promise(function(resolve) {
    console.log('promise1') // 4 
    resolve()
}).then(function() {
    console.log('promise2') // 微1.2 8 
})

console.log('script end') // 5
```

练习3
```
console.log('1 1');

setTimeout(function() { // 宏1
    console.log('2'); // 5 
    process.nextTick(function() { // 微2.1
        console.log('3'); // 9 
    })
    new Promise(function(resolve) {
        console.log('4'); // 6 
        resolve();
    }).then(function() {
        console.log('5') //微2.2 10
    })
})
process.nextTick(function() { // 微1.1 3
    console.log('6');
})
new Promise(function(resolve) {
    console.log('7'); // 2
    resolve();
}).then(function() {
    console.log('8') // 微1.2 4
})

setTimeout(function() { // 宏2
    console.log('9'); // 7
    process.nextTick(function() { // 微2.3
        console.log('10');  // 11
    })
    new Promise(function(resolve) {
        console.log('11'); // 8
        resolve();
    }).then(function() {
        console.log('12') // 微2.4 12
    })
})
```
例子4
```
async function async1() {
    console.log( 'async1 start' )
    await async2()
    console.log( 'async1 end' )
}
async function async2() {
    console.log( 'async2' )
}
console.log( 'script start' )
setTimeout( function () {
    console.log( 'setTimeout' )
}, 0 )
async1();
new Promise( function ( resolve ) {
    console.log( 'promise1' )
    resolve();
} ).then( function () {
    console.log( 'promise2' )
} )
console.log( 'script end' )
```

