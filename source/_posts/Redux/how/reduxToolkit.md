---
title: 【怎么用】Redux toolkit
category: Redux
date: 2018-08-27 20:29
top: 77
---

在【为什么】系列我们简单介绍了一下rtk的几个api，下面我们从真实项目中来介绍一下整个应用的过程

## 项目背景

该项目是一个比较庞大的业务项目，很多npm包都不是最新版本，比如react-redux，这也就意味着不能使用useDispatch、useSelector。下面说明一下添加reduxjs/toolkit需要作何改动和使用rtk如何来写一个普通的列表页

## 优化前后对比

总的来说，你将写更少的模板代码，用更优雅、快速的方式达到原生redux+thunk的效果

使用rtk优化后：
- src/store.tsx 总store生成文件
- utils/asyncRedux.tsx 用来更好的生成异步action的工具函数
- pages/xxx/slice.tsx 接收initialState，用来导出action、NAMESPACE
- utils/selectorsFactory.tsx  用来自动生成initialState里的一级key的selectors，为了selectors.tsx写更少的代码
- pages/xxx/selectors.tsx
- pages/xxx/services.tsx 
- pages/xxx/types.tsx 
- pages/xxx/index.tsx 

优化前：

- 会少写：
  - pages/xxx/slice.tsx 
- 会多写：
  - pages/xxx/constans.tsx
  - pages/xxx/actions.tsx（对constans、services各种引/使用）
  - pages/xxx/reducer.tsx（对constans、immutable各种引/使用）
  - pages/xxx/selectors.tsx 里的若干selector

## 示例

### 1. src/store.tsx

全局store生成文件，只添加thunk，该项目过大，开启immutableCheck的话会造成页面卡顿

```js
import { getDefaultMiddleware } from '@reduxjs/toolkit'

const middlewares = [sagaMiddleware, ...getDefaultMiddleware({
  thunk: true,
  immutableCheck: false,
  serializableCheck: false
})];
```

### 2. utils/asyncRedux.ts

```ts
import {
  createAsyncThunk,
} from '@reduxjs/toolkit';

import { notification } from 'antd'
import { showDownloadListModal } from 'containers/Main/actions'

/**
 * @description: 创建异步的Thunk生成器，会根据actionName自动寻找对应的service触发；
 * @return: async thunk
 * 这里特殊处理了传参类型，如若异步方法需要传参，需通过泛型准确传递；
 * T 参数泛型；K 返回值泛型
 */

declare interface IResponseData<T> {
  errno: number;
  errmsg: string;
  data: T;
  st?: number;
  logid?: string;
}
interface IParams {
  [key: string]: any;
}

export const createAsyncThunkCreator = (nameSpace: string, services: IParams) => function thunk<T = null, K = null, R = never>(actionName: string, service?: any) {
  const asyncService = service || services[`${actionName}Service`];

  if (asyncService) {
    return createAsyncThunk<IResponseData<R>, T, K>(
      `${nameSpace}/${actionName}`,
      async params => {
        const response = await asyncService(params);
        return response;
      },
    );
  }
  throw new Error(`Can not find ${actionName}Service`);
};

export const createServiceAsyncThunkCreator = (nameSpace: string, services: IParams) => (actionName: string, options?: {service?: any, isDownLoad?: boolean}) => {
  const asyncService = options?.service || services[`${actionName}Service`];
  if (asyncService) {
    if (options?.isDownLoad) {
      return createDownloadServiceAsyncThunk(`${nameSpace}/${actionName}`, async (params: any) => asyncService(params))
    }
    return createServiceAsyncThunk(`${nameSpace}/${actionName}`, async (params: any) => asyncService(params))
  }
  throw new Error(`Can not find ${actionName}Service`);
}

export function createServiceAsyncThunk<ThunkArg = null, Returned = null>(typePrefix: string, payloadCreator: (params: ThunkArg) => Promise<IResponseData<Returned>>) {
  return createAsyncThunk(
    typePrefix,
    async (params: ThunkArg, { rejectWithValue }) => {
      let res;
      try {
        res = await payloadCreator(params);    
      } catch (error) {
        notification.error({
          message: '网络错误，请稍后再试',
        });
      }
      if (res.errno) {
        notification.error({
          message: res.errmsg || '请求错误，请稍后再试',
        });
        return rejectWithValue(res);
      }
      return res;
    },
  );
}

export function createDownloadServiceAsyncThunk<ThunkArg = null, Returned = null>(typePrefix: string, payloadCreator: (params: ThunkArg) => Promise<IResponseData<Returned>>) {
  return createAsyncThunk(
    typePrefix,
    async (params: ThunkArg, { rejectWithValue, dispatch }) => {
      let res: any;
      try {
        res = await payloadCreator(params);    
      } catch (error) {
        notification.error({
          message: '网络错误，请稍后再试',
        });
      }
      if (res.errno) {
        notification.error({
          message: res.errmsg || '请求错误，请稍后再试',
        });
        return rejectWithValue(res);
      }
      if (res.data === -1) {
        notification.warn({
          message: '已存在下载任务，请下载完成后操作',
        });
      } else {
        notification.success({
          message: '下载任务添加成功',
        });
      }
      // 延时弹出下载框，保证 数据导出 的请求先于 下载列表 的请求到达后端服务器
      setTimeout(() => {
        dispatch(showDownloadListModal())
      }, 100)
      return res;
    },
  );
}
```

### 3. pages/xxx/services.tsx

必须以Service结尾，以自动注入thunk

```ts
import { getRequest, postRequest } from 'utils/request';

export default {
  getDataListService: (params: object) => getRequest('/srm/roundoff/grouplist', params),
  deleteGroupService: (id: any) => getRequest('/srm/roundoff/delgroup', {id})
}
```


### 4. pages/xxx/types.tsx

此处只是一个最简单的列表页用到的type
```ts
export interface IPagination {
  page: number;
  total: number;
}

export interface IStore {
  searchCondition: any,
  tableLoading: boolean,
  tableData: Array<any>,
  pagination: IPagination,
}
```

### 5. pages/xxx/slice.tsx

slice.reducers里直接使用immer写法即可达到immutable数据的效果

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createServiceAsyncThunkCreator } from 'utils/asyncRedux'
import services from './services'
import { IStore } from './types'

export const NAMESPACE = 'rotationRestGroup';

// 创建异步action
const createSimpleAsyncThunk = createServiceAsyncThunkCreator(NAMESPACE, services)
export const getDataList = createSimpleAsyncThunk('getDataList')
export const deleteGroup = createSimpleAsyncThunk('deleteGroup')

export const initialState: IStore = {
  searchCondition: {},
  tableLoading: false,
  tableData: [],
  pagination: {
    page: 1,
    total: 0,
  },
}

const slice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    initData(state) {
      state.searchCondition = initialState.searchCondition
      state.pagination = initialState.pagination
      state.tableData = initialState.tableData
    },
    updateSearchCondition(state, action: PayloadAction<any>) {
      state.searchCondition = action.payload
    },
    updatePagination(state, action: PayloadAction<any>) {
      state.pagination = action.payload
    }
  },
  extraReducers: {
    [getDataList.pending.type]: (state, action) => {
      state.tableLoading = true
    },
    [getDataList.fulfilled.type]: (state, action) => { // 异步请求-成功态
      state.tableLoading = false
      state.tableData = action.payload?.data?.list;
      state.pagination.total = action.payload?.data?.total;
    },
    [getDataList.rejected.type]: (state, action) => { // 异步请求-失败态
      state.tableLoading = false
      state.pagination = initialState.pagination
      state.tableData = initialState.tableData
    },
  }
})

export const { actions, reducer, name: sliceKey } = slice
```

### 6. utils/selectorsFactory.ts

需要注意的是namespaceSelector使用state.get，是因为旧项目最外层的state使用immutable的formJS生成

```ts
import { createSelector } from '@reduxjs/toolkit';

type TSelectorsMap<T> = {
  [K in keyof T]?: (state: T) => T[K]
}

type TRootState = any
export default function<T>(namespace: string, initialState: T): TSelectorsMap<T> {
  try {
    const selectorsMap: TSelectorsMap<T> = {}
    const namespaceSelector = (state: TRootState): T => state.get(namespace)
    const stateKeys = Object.keys(initialState);

    (stateKeys as Array<keyof T>).forEach((key: (keyof T)) => {
      selectorsMap[key] = createSelector(
        namespaceSelector,
        state => state[key]
      )
    })
    return selectorsMap
  } catch(e) {
    console.log('selectorsFactory Error: ', e)
    return {}
  }
}
```

### 7. pages/xxx/selectors.tsx
```ts
import { createSelector } from '@reduxjs/toolkit';
import selectorsFactory from 'utils/selectorsFactory'
import { NAMESPACE, initialState } from './slice'

const selectors = selectorsFactory(NAMESPACE, initialState);

export const selectTotal = createSelector(
  selectors.pagination,
  subState => subState.total,
);

export default selectors
```

### 8. pages/xxx/index.tsx

```ts
// 1 actions/thunks 都从slice文件导入
import injectReducer from 'utils/injectReducer';
import { NAMESPACE, reducer, actions, getDataList, deleteGroup } from './slice';
import selectors from './selectors';
import { IStore } from './types'

const withReducer = injectReducer({ key: NAMESPACE, reducer });

interface IProps extends FormComponentProps, globalNetProps, IStore {
  getDataList: any;
  deleteGroup: any;
  initData: any;
  updatePagination: any;
}

const XXXPage = (props: IProps) => {
  const { filterData, tableData, searchCondition, tableLoading, pagination, initData, getDataList, deleteGroup, updatePagination } = props

  // 2.1 普通action直接从props取出-调用即可
  updatePagination({
    ...pagination,
    page,
  })
  // 2.2 异步thunk也直接从props取出-调用即可
  getDataList(params).then((res: any) => {
    if(res.error) {
      notification.error({
        message: res.payload && res.payload.errmsg ? res.payload.errmsg : '网络错误，请稍候再试',
      });
    }
  })
  // ....
}

export default compose(
  withRouter,
  withReducer,
	connect(
    createStructuredSelector({
      ...globalNetPropsMapStateToProps,
      ...selectors,
    }),
    // 2.0 将同步/异步action注入props
    {
      getDataList,
      deleteGroup,
      ...actions,
    }
	),
	Form.create(),
)(XXXPage)
```


## 自动创建updateReducer
### 1. utils/reducersFactory.tsx
```js
import { PayloadAction } from '@reduxjs/toolkit'

export default function<T>(initialState: T) {
  try {
    const stateKeys = Object.keys(initialState)
    const reducersMap: any = {};

    (stateKeys as Array<keyof T>).forEach((key: (keyof T)) => {
      const mapKey = 'update' + key.charAt(0).toLocaleUpperCase().concat(key.slice(1))
      reducersMap[mapKey] = (state: T, action: PayloadAction<any>) => {
        state[key] = action.payload
      }
    })
    return reducersMap
  } catch(e) {
    console.log('selectorsFactory Error: ', e)
    return {}
  }
}
```

### 2. pages/xxx/slice.tsx

```js
import reducersFactory from 'utils/reducersFactory'
const normalReducers = reducersFactory(initialState)

const slice = createSlice({
  reducers: {
    ...normalReducers,
  }
})
```
## 注意

当有报错时，utils/asyncReduux 自动触发 notification.error，请勿重复手动触发

通过res判断是否正常返回时，通过`!res.error`判断，而不是`!res.errno`。因为网络错误或有errno时，返回的对象被rejectWithValue包了一层

## 异步导出

和普通异步action的区别只在于slice文件里创建action时的传参
-- 返回errno或网络错误时，自动报错 且 不打开下载弹窗
-- 成功时，自动打开下载弹窗

```js
// 统一创建thunk
const createSimpleAsyncThunk = createServiceAsyncThunkCreator(NAMESPACE, services)
// 普通异步action
export const getDowngrade = createSimpleAsyncThunk('getDowngrade')
// 多了一个参数
export const exportExcel = createSimpleAsyncThunk('exportExcel', { isDownload: true })
```

