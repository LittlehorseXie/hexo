---
title: 第一个接口--司机管理
category: 后端
---

PHP中文手册：http://php.net/manual/zh/index.php
PHP学习路线：https://github.com/yeszao/phproad
Linux命令：http://man.linuxde.net/scp

本文记录第一次写php接口（当然，是在搭好的odp基础上）所有的收获
‌
ODP是PHP的集成环境 = PHP + WebServer
nginx是WebServer的一种
‌
## 0 主要用到的目录结构
‌
以下目录结构为本次接口开发接触到的所有文件目录，包括一些配置文件
| 一级目录 | 二级目录 | 三级目录 | 四级目录 | 五级目录 | 六级目录 | 七级目录 | 介绍 |
|-------|--------|-------|--------|--------|-------|--------|-----|
| app	  | manage  | actions | api   | driver |	    |       | 供该项目app下其他模块使用的接口 |
|			 |driver	|DriverList.php| |		    |       |        |规定接口传参类型、名称、对参数的提示信息|
||			 |UpdDriver.php			|
|		   |conf    |	global.yaml				|
|		   |controllers|Driver.php|	 |		    |        |   |    |指定对外路径|
|		   |models	|dao	  |orm   	 |AreaOrm.php|		| |在DriverData可通过AreaOrm.find等直接查询片区数据库|
|||	 |	      |DriverOrm.php	|||	指定数据库名称，表名称|
||	 |rpc	    |GroundRpc.php	||||	访问第三方接口的函数写在这里，此文件第三方接口为Ground方|
||			 |service	|data	|DriverData.php		|ServiceData层|
|			 |page   	|Driver	|DriverListPage.php	|PageData层|
|||		 |		  	|UpdDriver.php	|
||		|Bootstrap.php			|		
||		|build.sh			|		
||		|index.php			|		
|conf|	rpc|	service|	db|	svs.yaml			|
		|	ground.yaml	|			
|php|	phplib|	sflib			|		依赖|
	|sbin|	php-fpm				|	php start 路径|
|schemas|	svs|	driver.php	|				数据库表|
|webroot|	manage|	index.php	|				manage模块的入口文件，拷贝的app/manage/index.php|
|webserver|	conf|	vhost|	php.conf	|			可以配置自己环境的端口号|
		|nginx.conf					|
	|loadnginx.sh					|	启动webserver路径|
‌
其中，有一些是被依赖其他模块的数据访问，比如片区数据库AreaOrm、GroundRpc
‌
分层结构：action -> page service -> data service -> dao
‌
## 1 功能实现 -- 获取司机列表
‌
### 1.1 返回字段
key	des
area_id	司机所在的片区id
area_name	司机所在的片区名称
driver_id	司机工号
driver_name	司机名字
‌
### 1.2 整体思路
‌
1. 从数据库获取所有片区
2. 从依赖方获取所有片区的所有司机（但依赖方一次只支持获取一个片区的司机信息）
3. 更新数据库信息
4. 通过筛选条件返回司机列表
‌
### 1.3 关键代码实现(dataService)
‌
获取所有片区

$areas = AreaOrm::findRows(['area_id', 'area_name'], []);
‌
从依赖方获取司机

```php
$driver_list = [];
$groundrpc = new GroundRpc();
foreach ($areas as $area) {
    $res = $groundrpc->getDriverList($area['area_id']);
    if (!is_null($res)) {
        foreach ($res as &$driver){
            $driver['area_id']=$area['area_id'];
            $driver['area_name']=$area['area_name'];
        }
        $driver_list = array_merge($driver_list, $res);
    }
}
```
‌
更新数据库信息（添加新司机、更新已有司机、删除数据库里有但是依赖方没有的司机）

```php
$insertArr = [];
foreach ($driver_list as $driver) {
    $find = DriverOrm::findColumn('driver_id', [
        'driver_id' => $driver['driverId']
    ]);
    // 处理需要存到数据库里的司机信息
    $driverData = [....];
    if (empty($find)) {
        // 如果数据库里没有，但是依赖方返回了，放到数组里，后续统一插入数据库
        $insertArr[] = $driverData;
    } else {
        // 如果数据库里有，且依赖方返回了，更新数据库
        DriverOrm::updateAll($driverData, [
            'driver_id' => $driver['driverId']
        ]);
    }
}
if (!empty($insertArr)) {
    DriverOrm::batchInsert($insertArr, true);
}
$gIds = array_column($driver_list, 'driverId'); // 依赖方返回的所有司机id
$dIds = DriverOrm::findColumn('driver_id', []); // 数据库里的所有司机id
$deleteIds = array_diff($dIds, $gIds); // 返回数据库里有但依赖方没有的id
// 统一删除司机
if (!empty($deleteIds)) {
    DriverOrm::deleteAll([
        'driver_id' => ['in', $deleteIds]
    ]);
}
‌```

根据查询条件返回结果
```
$columns = ['*'];
$conditions = [];
if (!empty($area_id)) {
    $conditions['area_id'] = $area_id;
}
$query_result = DriverOrm::findRows($columns, $conditions, [], $offset, $limit);
$count = DriverOrm::count($conditions);
return ['list' => $query_result, 'count' => $count];
‌```

## 2 出现的问题
‌
### 2.1 线上有主库从库，先写数据库（写到主库），然后马上从数据库读（从从库里读）可能查询不到
‌
解决：用事务（强制从主库里读）
‌
### 2.2 依赖接口返回慢，单线程，每次查询一个片区，如果片区很多，返回更慢
‌
解决：采用并发访问接口，但还要注意如果数量太大要分批并发访问，比如一次并发最多20个片区
‌
## 3 用到的方法、指令
‌
### 3.1 Orm篇
‌
findColumn 返回指定列数组
```
DriverOrm::findColumn('driver_id', [
    'driver_id' => $driver_id,
]);
DriverOrm::findColumn('driver_id', []);
‌```

findRows 
```
AreaOrm::findRows(['area_id', 'area_name'], []);
‌```

batchInsert 批量插入，true为忽略报错
```
DriverOrm::batchInsert($insertArr, true);
‌```

updateAll 批量更新
```
DriverOrm::updateAll([
    'status' => $status
], [
    'driver_id' => $driver_id
]);
‌```

deleteAll 批量删除
```php
DriverOrm::deleteAll([
    'driver_id' => ['in', $deleteIds]
]);
```
‌
muiltrequest
‌
### 3.2 php函数

```
// 获取 $driver_list 中所有的 driverId 字段
$gIds = array_column($driver_list, 'driverId');
// 返回 $dIds 中有的，但 $gIds 中没有的
$deleteIds = array_diff($dIds, $gIds);
// 合并两个数组
$insertArr[] = array_merge(['driver_id' => $driver['driverId']], $driverData);
```

### 3.3 linux命令

grep 'queryVehicleList' /home/work/odp_svs/log/rpc/rpc-request.log.2019052418
grep "home\/work\/odp_svs" webserver/conf/* -rin
tailf php-error.log
​
// 解压文件夹
tar zxf sf-odp-latest.tar.gz
// 移动
mv sf-odp odp_costa_xty
// 启动
php/sbin/php-fpm start
webserver/loadnginx.sh start


## 4 日志查看 -- log模块
‌
500错误、php语法错误
php-error.log
‌
404
access_log.log
‌
app 下模块错误 ，比如manage下接口有问题：
manage.log.wf  Log.warning + fatal
manage.log.dt  Log.debug + trace
manage.log notice 不常用
‌
查询 rpc 耗时
log/rpc/rpc-request.log
‌
## 5 phpstorm使用
‌
### 5.1 快捷键 
‌
command + K                        git push、撤销当前更改代码
option + command + L        自动格式化代码
shift + command + F            全局搜索
‌
### 5.2 配置git仓库
​
‌
### 5.3 配置远程环境并上传文件
‌
进入 Tools -- Deployment -- Configuration 进入配置
勾选 Tools -- Deployment -- Automatic Upload 自动上传
‌
右键文件夹 Deployment -- Upload 手动上传
‌
### 5.4 配置数据库
‌
右上角侧边栏
‌
## 6 postman 使用
‌
command + S 可以保存到一个文件夹里，方便以后使用
