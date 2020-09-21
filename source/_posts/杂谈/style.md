---
title: 样式方案
category: 杂谈
date: 2020-07-17 14:28
top: 96
---


1、整体布局样式控制；
在src/styles/global.less统一控制

2、全局样式控制，依赖 Antd 样式；
在src/styles/theme/cover.less统一控制

3、Page-Content 样式控制；
react-css-modules

4、Component 样式控制；
react-css-modules

5、Less or Sass，antd 使用的是 less，推荐 less;
less

6、动态换肤；



## 页面/组件样式方案

> 建议：如需通过类名控制样式，要使用`styleName`代替 className，并使用`CSSModules`包裹组件
> 注意：如需修改个别antd组件（比如：某一个页面的 antd-Modal 标题部分），这时把 styleName 当作 props 传会导致 typescript 报错，请参考 使用说明-Component 样式控制

### 方案选择

除全局样式统一维护在 src/styles/文件夹下直接用 less 维护，其他样式全部使用 react-css-modules + less

原因如下：

1. 解决了`传统less`的问题

- 人为使用命名空间解决样式冲突问题，维护成本较大

2. 解决了`css in JS`（代表 styled-components）的问题

- 用非传统方式写 css，比如 使用模板字符串（标签+样式组合）
- 没有自动错误提示、自动补全（虽然可以通过 vscode 插件弥补）
- 在 chrome 审查元素时 不快速定位到文件和类名
- 虽然和 jsx 写在一个文件里可以使 CSS 更容易移除，但可能导致文件过长
- 不能使用 ExtractCssPlugin 分离 css 文件

3. 解决了`传统css module`的问题

- 必须使用  camelCase  来命名 css class names
- 当引入到  className  中时必须要使用  styles  对象
- CSS modules 和 全局 css 类混合在一起时难管理
- 引用没用定义的 CSS modules 不会出现警告

### 使用说明

1. 引入 react-css-modules 和对应的`less文件`

```javascript
import CSSModules from "react-css-modules";
import styles from "./index.less";
```

2. 弃用 className，`改用styleName`

```javascript
<AntdLayout styleName="ILSLayout" />
```

3. 导出的组件使用`CSSModules包裹`

```javascript
export default withRouter(
  CSSModules(Layout, styles, {
    allowMultiple: true // 默认false，true时允许在styleName里写多个类名，如styleName="name1 name2"
  })
);
```

#### 1.Page-Content 样式控制

每个 page 的样式统一在 pages 对应具体 page 文件夹下面的 index.less 文件维护（包括但不限于 page 下面的 components、modules），全部使用 react-css-modules，具体可参考 src/pages/Layout

#### 2.Component 样式控制

对于全局的 components （比如面包屑、筛选器包裹容器等），样式文件放在 components 对应具体 component 文件夹下面的 index.less 文件维护，全部使用 react-css-modules，具体可参考 src/components/FilterFormWrapper

> 某些情况，必须给antd组件赋className，但是使用styleName会导致typescript校验失败，这时可以：
  - 写不影响其他元素的行内样式，比如：icons的样式覆盖
  - 直接使用className，在less文件里用:glabal()包裹类名，比如：:glabal(.someClass) { ... }



写个node工具 “一键把styled-component刷成css-modules”



支持外部css的人，认为：

* 组件是jsx，应该和css分离，保证组件的纯净
* 外部css也可以有很好的管理方式
* 命名空间的问题只要制定规范化的样式命名管理，就可以避免
* 可以提取可复用的样式进行管理


支持组件内部样式的人，认为：

* 样式是属于组件自身的特性，应该和jsx合并在一起，才更加符合一个组件是一个单独的个体的思想
* 不用再担心样式命名的问题
* 组件的逻辑、生命周期、样式、结构完全和其他组件解耦，对组件维护很有帮助





**传统less痛点**
- [ ] 人工维护，类名容易重复，全局污染

**css in JS代表styled-components痛点**
- [ ] 用非传统方式写css，使用模板字符串（标签+样式组合
- [ ] 没有自动错误提示、自动补全（可以通过vscode插件弥补
- [ ] 在chrome审查元素时 不快速定位到文件 和 类名
- [ ] 虽然和jsx写在一个文件里可以使CSS 更容易移除，但可能导致文件过长
- [ ] 不能使用ExtractCssPlugin分离css文件

**传统css module问题**
- [ ] 必须使用 camelCase 来命名 css class names
- [ ] 当引入到 className 中时必须要使用 styles 对象
- [ ] CSS modules 和 全局css类混合在一起会很难管理
- [ ] 引用没用定义的CSS modules不会出现警告

**css module代表react-css-modules优点**
- [ ] 解决了普通css modules的问题
- [ ] 解决了styled-components痛点
    - [ ] 可以用传统less写css
    - [ ] 有错误提示，自动补全
    - [ ] 生成的className可以配置文件路径在里面
    - [ ] 与tsx文件分离
    - [ ] 可以分离css文件

src-pages-Layout-___index__ILSLayout___2-4Ax


**react-css-modules缺点**
- [ ] 需要每个用局部样式的地方，都引入CSSModules(Layout, styles)
- [ ] 局部样式用styleName，非class


**react-css-modules遇到的问题**
- [ ] 报错：”xxxxxxx” CSS module is undefined.
    - [ ] webpack less文件正确配置loader
- [ ] 修改less文件不热更新，但是也不报错
    - [ ] 把webpack.base.config里的optimization: options.optimization去掉
- [ ] 报错：Aborting CSS HMR due to changed css-modules locals 
    - [ ] 升级style-loader从0.23.1到1.1.3版本
- [ ] 要给antd组件添加className，但styleName会导致typescript检测报错
    - [ ] 写行内样式，或者className + less里 :global(.class) {}


**几个原则**
- [ ] 避免样式污染
- [ ] 不完全依赖人为约定，排除nameSpace
- [ ] 和html分离，排除 styled-jsx
- [ ] 支持所有的css写法
- [ ] 支持嵌套语法

**几个最好**
- [ ] 最好能按照大家习惯的传统书写方式
    - [ ] 最好能用传统css的方式写
    - [ ] 最好能按照传统className方式写
- [ ] 最好能在chrome审查元素时 快速定位到文件 和 类名
- [ ] 最好有自动错误提示、自动补全


- [ ] 支持样式覆盖


Npm i —save

@types/react-css-modules
react-css-modules

webpack
```js
{
        test: /\.less$/,
        include: [path.resolve(process.cwd(), './src/styles'), path.resolve(process.cwd(), './node_modules/antd')],
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.less$/,
        exclude:[path.resolve(process.cwd(), './src/styles'), path.resolve(process.cwd(), './node_modules/antd')],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true,
              localIdentName: '[path]___[name]__[local]___[hash:base64:5]'
            }
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
                strictMath: true, 
                noIeCompat: true,
              },
            },
          },
        ],
      },
```

index.tsx
```js
import CSSModules from 'react-css-modules';
import styles from './index.less';
import '../../styles/global.less'

<AntdLayout styleName="ILSLayout test4" className="fontLoaded">

export default withRouter(CSSModules(Layout, styles, {
  allowMultiple: true,
}));
```

modules.d.ts
```js
declare module '*.less' 
// {
//   const content: { [className: string]: string };
//   export default content;
// }
```
