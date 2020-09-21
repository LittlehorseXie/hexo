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






