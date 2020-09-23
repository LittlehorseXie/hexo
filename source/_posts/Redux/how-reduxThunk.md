---
title: 【怎么用】Redux thunk
category: Redux
date: 2018-08-27 20:29
top: 79
---

Redux的核心代码形式，完全就是同步的，但是我们经常需要处理一些异步请求，这时我们要怎么做呢

比如要实现一个列表页

使用传统方式大概是这样的

```js
export const IssuesListPage = ({
  org,
  repo,
  page = 1,
  setJumpToPage,
  showIssueComments
}: ILProps) => {
  const [issuesResult, setIssues] = useState<IssuesResult>({
    pageLinks: null,
    pageCount: 1,
    issues: []
  })
  const [numIssues, setNumIssues] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [issuesError, setIssuesError] = useState<Error | null>(null)

  const { issues, pageCount } = issuesResult

  useEffect(() => {
    async function fetchEverything() {
      async function fetchIssues() {
        const issuesResult = await getIssues(org, repo, page)
        setIssues(issuesResult)
      }

      async function fetchIssueCount() {
        const repoDetails = await getRepoDetails(org, repo)
        setNumIssues(repoDetails.open_issues_count)
      }

      try {
        await Promise.all([fetchIssues(), fetchIssueCount()])
        setIssuesError(null)
      } catch (err) {
        console.error(err)
        setIssuesError(err)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)

    fetchEverything()
  }, [org, repo, page])

  // omit rendering
}
```

这种写法，其实把state 异步接口请求 dom全写在一起
从代码可以看出fetchEverything函数在useEffect里先声明然后立即调用，因为我们不能在useEffect之外的地方用async的方式。这种写法并不符合React的建议：useEffect callback需要返回一个value，但这里返回的是一个Promise
此外，里面还包裹了另外两个async函数— fetchIssues和fetchIssueCount


这时，我们需要借助redux中间件来帮助我们解决这些事情

- 触发action的时候能够执行异步操作
- Pause, modify, delay, replace, or halt dispatched actions



我们可以借助 thunk 来解决这些问题（副作用）

```js
// issuesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Links } from 'parse-link-header'

import { Issue, IssuesResult, getIssue, getIssues } from 'api/githubAPI'
import { AppThunk } from 'app/store'

interface IssuesState {
  issuesByNumber: Record<number, Issue>
  currentPageIssues: number[]
  pageCount: number
  pageLinks: Links | null
  isLoading: boolean
  error: string | null
}

const issuesInitialState: IssuesState = {
  issuesByNumber: {},
  currentPageIssues: [],
  pageCount: 0,
  pageLinks: {},
  isLoading: false,
  error: null
}

function startLoading(state: IssuesState) {
  state.isLoading = true
}

function loadingFailed(state: IssuesState, action: PayloadAction<string>) {
  state.isLoading = false
  state.error = action.payload
}

const issues = createSlice({
  name: 'issues',
  initialState: issuesInitialState,
  reducers: {
    getIssuesStart: startLoading,
    getIssuesSuccess(state, { payload }: PayloadAction<IssuesResult>) {
      const { pageCount, issues, pageLinks } = payload
      state.pageCount = pageCount
      state.pageLinks = pageLinks
      state.isLoading = false
      state.error = null

      issues.forEach(issue => {
        state.issuesByNumber[issue.number] = issue
      })

      state.currentPageIssues = issues.map(issue => issue.number)
    },
    getIssuesFailure: loadingFailed
  }
})

export const {
  getIssuesStart,
  getIssuesSuccess,
  getIssuesFailure
} = issues.actions

export default issues.reducer

export const fetchIssues = (
  org: string,
  repo: string,
  page?: number
): AppThunk => async dispatch => {
  try {
    dispatch(getIssuesStart())
    const issues = await getIssues(org, repo, page)
    dispatch(getIssuesSuccess(issues))
  } catch (err) {
    dispatch(getIssuesFailure(err.toString()))
  }
}
```

```js
import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { fetchIssuesCount } from 'features/repoSearch/repoDetailsSlice'
import { RootState } from 'app/rootReducer'

import { IssuesPageHeader } from './IssuesPageHeader'
import { IssuesList } from './IssuesList'
import { IssuePagination, OnPageChangeCallback } from './IssuePagination'
import { fetchIssues } from './issuesSlice'

// omit code

const dispatch = useDispatch()

const {
  currentPageIssues,
  isLoading,
  error: issuesError,
  issuesByNumber,
  pageCount
} = useSelector((state: RootState) => state.issues)


const openIssueCount = useSelector(
  (state: RootState) => state.repoDetails.openIssuesCount
)

const issues = currentPageIssues.map(
  issueNumber => issuesByNumber[issueNumber]
)

useEffect(() => {
  dispatch(fetchIssues(org, repo, page))
  dispatch(fetchIssuesCount(org, repo))
}, [org, repo, page, dispatch])
```
以上删除了useState，引入了useDispatch，通过useSelector获取需要的状态，dispatch fetchIssue thunk来获取数据


(作为一个有趣的旁注：原始代码始终导致页面跳回顶部，因为数据在第一次render时不存在，因此没有内容。如果数据还存在，并且我们render它，则页面可能会保留数据列表中的滚动位置，因此有时我们必须强制滚动回顶部。)

以上，需要注意的是，可能会导致性能问题。 每次selector运行的时候, （如果openIssueCount是一个比较复杂的对象），它都返回一个新对象. 不像 connect, useSelector 默认依赖于引用相等. 因此, 返回一个新对象导致组件每当action触发时，都会重新渲染，尽管数据可能完全相同

我们可以通过以下方式解决:

把对象每个值拆分成不同的useSelector
使用记忆选择器，比如createSelector from Reselect
使用React-Redux的shallowEqual函数来比较结果
