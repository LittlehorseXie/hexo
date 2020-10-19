---
title: git cz
category: 杂谈
date: 2020-10-19 19:00
top: 91
---

## 使用

执行`git cz`进入interactive模式

生成的commit message格式如下：
```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```


## 如何进行自定义配置

### 1. 安装依赖包
```
npm i -D husky @commitlint/config-conventional @commitlint/cli
```
全局安装cz-customizable
```
npm install -g cz-customizable
```

### 2. package.json 添加代码
```json
"husky": {
  "hooks": {
    "commit-msg": "commitlint -e $GIT_PARAMS"
  }
},
"config": {
  "commitizen": {
    "path": "cz-customizable"
  }
}
```
**husky**会在指定的**git hook**触发时调用相应的命令。
**commitlint**校验失败后会**停止本次提交**并**展示错误信息**，我们可以按照提示重新进行代码提交。
**commitizen**会查找 .cz-config.js 配置文件

### 3. 添加 .cz-config.js 配置文件

自定义提交规范，示例如下

```js
module.exports = {
  types: [
    { value: 'feat', name: 'feat:     新功能' },
    { value: 'fix', name: 'fix:      bug修复' },
    { value: 'docs', name: 'docs:     更新文档' },
    { value: 'style', name: 'style:    修改主题样式' },
    { value: 'refactor', name: 'refactor: 重构' },
    { value: 'perf', name: 'perf:     性能提升' },
    { value: 'chore', name: 'chore:    修改辅助工具' },
    { value: 'revert', name: 'revert:   回滚commit' },
  ],

  // scopes: [{ name: 'accounts' }, { name: 'admin' }, { name: 'exampleScope' }, { name: 'changeMe' }],
  // // it needs to match the value for field type. Eg.: 'fix'
  // scopeOverrides: {
  //   fix: [
  //     {name: 'merge'},
  //     {name: 'style'},
  //     {name: 'e2eTest'},
  //     {name: 'unitTest'}
  //   ]
  // },

  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: 'TICKET-',
  ticketNumberRegExp: '\\d{1,5}',

  // override the messages, defaults are as follows
  messages: {
    type: "选择要提交的更改类型:",
    scope: '选择更改影响的范围（可选）:',
    // used if allowCustomScopes is true
    customScope: '更改内容的所属需求为:',
    subject: '写一个简短、命令时态的语句来描述更改:\n',
    body: '详细描述更改原因 (可选，按回车跳过). 使用 "|" 来换行:\n',
    breaking: '列出 BREAKING CHANGES (optional):\n',
    footer: '列出这次更改 关闭的 ISSUES (可选). 如: #31, #34:\n',
    confirmCommit: '确定提交上面的更改?',
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  // skip any questions you want
  skipQuestions: ['body', 'breaking', 'footer'],

  // limit subject length
  subjectLimit: 50,
  // breaklineChar: '|', // It is supported for fields body and footer.
  // footerPrefix : 'ISSUES CLOSED:'
  // askForBreakingChangeFirst : true, // default is false
};
```


### 4. 创建 commitlint.config.js

```
module.exports = {
  extends: ["@commitlint/config-conventional"]
};
```

