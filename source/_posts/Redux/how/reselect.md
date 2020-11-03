---
title: 【怎么用】reselect
category: Redux
date: 2020-09-18 20:29
top: 76
---

```js
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { toggleTodo } from 'features/todos/todosSlice'
import TodoList from '../components/TodoList'
import { VisibilityFilters } from 'features/filters/filtersSlice'

const selectTodos = state => state.todos // 统一命名为selectX
const selectFilter = state => state.visibilityFilter
const selectVisibleTodos = createSelector(
  [selectTodos, selectFilter], // 传入input selectors数组
  (todos, filter) => { // output selector，传参为上面的数组返回的数据
    switch (filter) {
      case VisibilityFilters.SHOW_ALL:
        return todos // 返回需要的数据
      case VisibilityFilters.SHOW_COMPLETED:
        return todos.filter(t => t.completed)
      case VisibilityFilters.SHOW_ACTIVE:
        return todos.filter(t => !t.completed)
      default:
        throw new Error('Unknown filter: ' + filter)
    }
  }
)

const mapStateToProps = state => ({
  todos: selectVisibleTodos(state)
})
const mapDispatchToProps = { toggleTodo }

// mapStateToProps可优化为
const mapStateToProps = createStructuredSelector({
  todos: selectVisibleTodos
})
```