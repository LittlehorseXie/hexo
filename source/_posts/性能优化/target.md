---
title: 在实际用户的设备上衡量这些指标
category: 性能优化
top: 92
---

过去，我们针对加载和 DOMContentLoaded 等指标进行优化的一个主要原因是，这些指标在浏览器中显示为事件，而且容易针对实际用户进行衡量。

相比而言，许多其他指标在过去很难加以衡量。 例如，以下代码是开发者经常用来检测耗时较长任务的黑客手段：

```javascript
(function detectLongFrame() {
  var lastFrameTime = Date.now();
  requestAnimationFrame(function() {
    var currentFrameTime = Date.now();

    if (currentFrameTime - lastFrameTime > 50) {
      // Report long frame here...
    }

    detectLongFrame(currentFrameTime);
  });
}());
```
此代码以无限循环的 requestAnimationFrame 开头，并记录每次迭代所花费的时间。 如果当前时间距离前次时间超过 50 毫秒，则会认为原因在于存在耗时较长的任务。 虽然大部分情况下此代码都行得通，但其也有不少缺点：

此代码会给每个帧增加开销。
此代码会阻止空闲块。
此代码会严重消耗电池续航时间。
性能测量代码最重要的规则是不应降低性能。

Lighthouse 和 Web Page Test 等服务已经提供部分新指标一段时间（一般而言，这些工具非常适合用于在功能发布前测试其性能），但这些工具并未在用户设备上运行，因此未反映出用户的实际性能体验。

幸运的是，得益于新增的几个浏览器 API，我们终于可以在实际设备上衡量这些指标，而无需使用大量可能降低性能的黑客手段或变通方法。

这些新增的 API 是 PerformanceObserver、PerformanceEntry 和 DOMHighResTimeStamp。 为显示实际运行这些新 API 的一些代码，以下代码示例创建新的 PerformanceObserver 实例，并通过订阅接收有关绘制输入（例如， FP 和 FCP）以及发生任何耗时较长任务的通知：

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // `entry` is a PerformanceEntry instance.
    console.log(entry.entryType);
    console.log(entry.startTime); // DOMHighResTimeStamp
    console.log(entry.duration); // DOMHighResTimeStamp
  }
});

// Start observing the entry types you care about.
observer.observe({entryTypes: ['resource', 'paint']});
```

PerformanceObserver 为我们提供的新功能是，能够在性能事件发生时订阅这些事件，并以异步方式响应事件。 此 API 取代旧的 PerformanceTiming 界面，后者通常需要执行轮询才能查看数据可用的时间。


## 跟踪 FP/FCP

获得特定性能事件的数据之后，您可将其发送给您用来为当前用户捕捉指标的任何分析服务。 例如，通过使用 Google Analytics，您可跟踪首次绘制时间，如下所示：

```javascript
<head>
  <!-- Add the async Google Analytics snippet first. -->
  <script>
  window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('send', 'pageview');
  </script>
  <script async src='https://www.google-analytics.com/analytics.js'></script>

  <!-- Register the PerformanceObserver to track paint timing. -->
  <script>
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // `name` will be either 'first-paint' or 'first-contentful-paint'.
      const metricName = entry.name;
      const time = Math.round(entry.startTime + entry.duration);

      ga('send', 'event', {
        eventCategory:'Performance Metrics',
        eventAction: metricName,
        eventValue: time,
        nonInteraction: true,
      });
    }
  });
  observer.observe({entryTypes: ['paint']});
  </script>

  <!-- Include any stylesheets after creating the PerformanceObserver. -->
  <link rel="stylesheet" href="...">
</head>
```
您必须确保 PerformanceObserver 在任何样式表之前于文档的 <head> 中注册，以使其在 FP/FCP 发生前运行。

## 使用主角元素跟踪 FMP

确定页面上的主角元素之后，您可以跟踪为用户呈现这些元素的时间点。

目前尚无标准化的 FMP 定义，因此也没有性能条目类型。 部分原因在于很难以通用的方式确定“有效”对于所有页面意味着什么。

但是，一般来说，在单个页面或单个应用中，最好是将 FMP 视为主角元素呈现在屏幕上的时刻。

Steve Souders 撰写了一篇精彩的文章，名为用户计时与自定义指标，其中详细说明使用浏览器性能 API 来确定代码中各类媒体呈现时间的技术。

## 跟踪 TTI

从长远来看，我们希望将 TTI 指标标准化，并通过 PerformanceObserver 在浏览器中公开。 同时，我们已开发出一个 polyfill，它可用于检测目前的 TTI，并适用于所有支持 Long Tasks API 的浏览器。

该 polyfill 公开 getFirstConsistentlyInteractive() 方法，后者返回使用 TTI 值进行解析的 promise。 您可使用 Google Analytics 来跟踪 TTI，如下所示：

```javascript
import ttiPolyfill from './path/to/tti-polyfill.js';

ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
  ga('send', 'event', {
    eventCategory:'Performance Metrics',
    eventAction:'TTI',
    eventValue: tti,
    nonInteraction: true,
  });
});
```

getFirstConsistentlyInteractive() 方法接受可选的 startTime 配置选项，让您可以指定下限值（您知道您的应用在此之前无法进行交互）。 默认情况下，该 polyfill 使用 DOMContentLoaded 作为开始时间，但通常情况下，使用主角元素呈现的时刻或您知道所有事件侦听器都已添加的时间点这类时间会更准确。

## 跟踪耗时较长的任务

上文提到，耗时较长的任务通常会带来某种负面的用户体验（例如， 事件处理程序运行缓慢，或者掉帧）。 您最好了解发生这种情况的频率，以设法尽量减少这种情况。

要在 JavaScript 中检测耗时较长的任务，请创建新的 PerformanceObserver，并观察类型为 longtask 的条目。 耗时较长的任务条目的一个有点是包含提供方属性，有助于您更轻松地追查导致出现耗时较长任务的代码：

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    ga('send', 'event', {
      eventCategory:'Performance Metrics',
      eventAction: 'longtask',
      eventValue:Math.round(entry.startTime + entry.duration),
      eventLabel:JSON.stringify(entry.attribution),
    });
  }
});

observer.observe({entryTypes: ['longtask']});
```
提供方属性会指出导致耗时较长任务的帧上下文，这有助于您确定问题是否由第三方 iframe 脚本所致。 未来版本的规范计划添加更多详细信息并公开脚本网址、行号和列号，这有助于确定速度缓慢问题是否由您自己的脚本所致。

## 跟踪输入延迟
阻塞主线程的耗时较长任务可能会导致事件侦听器无法及时执行。 RAIL 性能模型指出，为提供流畅的界面体验，界面应在用户执行输入后的 100 毫秒内作出响应，若非如此，请务必探查原因。

若要在代码中检测输入延迟，您可将事件时间戳与当前时间作比较，如果两者相差超过 100 毫秒，您可以并应该进行报告。
```javascript
const subscribeBtn = document.querySelector('#subscribe');

subscribeBtn.addEventListener('click', (event) => {
  // Event listener logic goes here...

  const lag = performance.now() - event.timeStamp;
  if (lag > 100) {
    ga('send', 'event', {
      eventCategory:'Performance Metric'
      eventAction: 'input-latency',
      eventLabel: '#subscribe:click',
      eventValue:Math.round(lag),
      nonInteraction: true,
    });
  }
});
```
由于事件延迟通常是由耗时较长的任务所致，因此您可将事件延迟检测逻辑与耗时较长任务检测逻辑相结合：如果某个耗时较长的任务在 event.timeStamp 所示的时间阻塞主线程，您也可以报告该耗时较长任务的提供方值。 如此，您即可在负面性能体验与导致该体验的代码之间建立明确的联系。

虽然这种方法并不完美（不会处理之后在传播阶段耗时较长的事件侦听器，也不适用于不在主线程中运行的滚动或合成动画），但确实是良好的开端，让您能更好地了解运行时间较长的 JavaScript 代码对用户体验产生影响的频率。

## 解读数据
开始收集针对实际用户的性能指标后，就需要将该数据付诸实践。 实际用户性能数据十分有用，主要原因在于以下几个方面：

验证您的应用性能符合预期。
识别不良性能对转化（根据您具体的应用而定）造成负面影响的地方。
寻找改善用户体验和取悦用户的机会。
绝对有必要将应用在移动设备和桌面设备上的性能进行比较。 

按移动设备与桌面设备划分结果，并以分布图的方式分析数据，可让您迅速了解实际用户的体验。 例如，通过上表，我很容易便可发现，对于此应用，10% 的移动用户需等待 12 秒以上才能进行交互！

### 性能对业务的影响
在分析工具中跟踪性能有一项巨大优势，即您之后可以利用该数据来分析性能对业务的影响。

如果您在分析工具中跟踪目标达成情况或电子商务转化情况，则可通过创建报告来探查两者与应用性能指标之间的关联。 例如：

体验到更快交互速度的用户是否会购买更多商品？
如果用户在结账流程中遇到较多耗时较长的任务，其离开率是否较高？
如果发现存在关联，即可轻松建立性能至关重要且应该优先考虑的商业案例。

### 加载放弃
我们知道，用户经常会因为页面加载时间过长而选择离开。 不幸的是，这意味着我们的所有性能指标都存在幸存者偏差，即数据不包括未等待页面加载完成的用户的加载指标（这很可能意味着数量过低）。

虽然您无法获悉如果这类用户逗留所产生的指标，但可以跟踪发生这种情况的频率以及每位用户逗留的时长。

使用 Google Analytics 完成此任务比较棘手，因为 analytics.js 库通常是以异步方式加载，而且可能在用户决定离开前尚不可用。 但是，您无需等待 analytics.js 加载完成再将数据发送到 Google Analytics。 您可以直接通过 Measurement Protocol 发送数据。

以下代码为 visibilitychange 事件添加侦听器（该事件在页面卸载或进入后台时触发），并在该事件触发时发送 performance.now() 值。

```javascript
<script>
window.__trackAbandons = () => {
  // Remove the listener so it only runs once.
  document.removeEventListener('visibilitychange', window.__trackAbandons);
  const ANALYTICS_URL = 'https://www.google-analytics.com/collect';
  const GA_COOKIE = document.cookie.replace(
    /(?:(?:^|.*;)\s*_ga\s*\=\s*(?:\w+\.\d\.)([^;]*).*$)|^.*$/, '$1');
  const TRACKING_ID = 'UA-XXXXX-Y';
  const CLIENT_ID =  GA_COOKIE || (Math.random() * Math.pow(2, 52));

  // Send the data to Google Analytics via the Measurement Protocol.
  navigator.sendBeacon && navigator.sendBeacon(ANALYTICS_URL, [
    'v=1', 't=event', 'ec=Load', 'ea=abandon', 'ni=1',
    'dl=' + encodeURIComponent(location.href),
    'dt=' + encodeURIComponent(document.title),
    'tid=' + TRACKING_ID,
    'cid=' + CLIENT_ID,
    'ev=' + Math.round(performance.now()),
  ].join('&'));
};
document.addEventListener('visibilitychange', window.__trackAbandons);
</script>
```
要使用此代码，请将其复制到文档的 <head> 中，并将 UA-XXXXX-Y 占位符替换为您的跟踪 ID。

此外，您还应确保在页面可进行交互时移除此侦听器，否则您在报告 TTI 时还需报告放弃加载。

document.removeEventListener('visibilitychange', window.__trackAbandons);

## 优化性能以及避免性能下降

定义以用户为中心的指标的好处在于，您优化这些指标时，用户体验必然也会同时改善。

改善性能最简单的一种方法是，直接减少发送到客户端的 JavaScript 代码，但如果无法缩减代码长度，则务必要思考如何提供 JavaScript。

### 优化 FP/FCP
从文档的 <head> 中移除任何阻塞渲染的脚本或样式表，可以减少首次绘制和首次内容绘制前的等待时间。

花时间确定向用户指出“正在发生”所需的最小样式集，并将其内联到 <head> 中（或者使用 HTTP/2 服务器推送)），即可实现极短的首次绘制时间。

应用 shell 模式可以很好地说明如何针对渐进式网页应用实现这一点。

### 优化 FMP/TTI
确定页面上最关键的界面元素（主角元素）之后，您应确保初始脚本加载仅包含渲染这些元素并使其可交互所需的代码。

初始 JavaScript 软件包中所包含的任何与主角元素无关的代码都会延长可交互时间。 没有理由强迫用户设备下载并解析当前不需要的 JavaScript 代码。

一般来说，您应该尽可能缩短 FMP 与 TTI 之间的时间。 如果无法最大限度缩短此时间，界面绝对有必要明确指出页面尚不可交互。

对于用户来说，其中一种最令人失望的体验就是点按元素后毫无反应。

### 避免出现耗时较长的任务
拆分代码并按照优先顺序排列要加载的代码，不仅可以缩短页面可交互时间，还可以减少耗时较长的任务，然后即有希望减少输入延迟及慢速帧。

除了将代码拆分为多个单独的文件之外，您还可将大型同步代码块拆分为较小的块，以便以异步方式执行，或者推迟到下一空闲点。 以异步方式在较小的块中执行此逻辑，可在主线程中留出空间，供浏览器响应用户输入。

最后，您应确保测试第三方代码，并对任何低速运行的代码追责。 产生大量耗时较长任务的第三方广告或跟踪脚本对您业务的伤害大于帮助。

## 避免性能下降
本文重点强调的是针对实际用户的性能测量，虽然 RUM 数据确实是十分重要的性能数据，但实验室数据对于在发布新功能前确保应用性能良好（而且不会下降）而言仍然十分关键。 实验室测试非常适合用于检测性能是否下降，因为这些测试是在受控环境中运行，出现随机变化的可能性远低于 RUM 测试。

Lighthouse 和 Web Page Test 等工具可以集成到持续集成服务器中，而且您可以编写相应的测试，以在关键指标退化或下降到低于特定阈值时将构件判定为失败。

对于已发布的代码，您可以添加自定义提醒，以通知您负面性能事件的发生率是否意外突增。 例如，如果第三方发布其某个服务的新版本，而您的用户突然开始看到大量新增的耗时较长任务，就代表出现这种情况。

为成功避免性能下降，您必须在实验室和实际运行环境中针对发行的每个新功能进行性能测试。

发布过程中 RUM 和实验室测试的流程图

## 总结与前景展望
在过去的一年中，我们已在于浏览器中向开发者公开以用户为中心的指标方面取得巨大进步，但工作还没有结束，还有许多计划尚待完成。

我们真的希望将可交互时间和主角元素指标标准化，让开发者不必自己测量这些指标或依赖于 polyfill。 我们还希望帮助开发者更轻松地找到导致掉帧和输入延迟的特定耗时较长任务，以及产生这些任务的代码。

虽然还有很多工作要做，但我们对已经取得的进展感到兴奋。 凭借 PerformanceObserver 等新 API，以及浏览器对耗时较长任务的原生支持，开发者终于拥有所需的原语，能够针对实际用户测量性能而不会影响用户体验。

能够代表实际用户体验的指标就是最重要的指标，我们希望尽可能地为开发者提供便利，助其取悦用户并创建出色的应用。