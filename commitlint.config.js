module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 'scope-empty': [2, 'never'],
    'scope-empty': [0],
    'scope-case': [0]
  },
};