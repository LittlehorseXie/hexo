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