# 司机模块测试文档

## 测试目标
- 验证司机可接单状态查询与更新。

## 自动化测试
### 用例1：更新可接单状态
- 文件：`driver-service/src/test/java/com/o2o/hitch/driver/service/DriverServiceTest.java`
- 断言：更新后查询返回 `available=false`。

### 用例2：司机订单操作作用域
- 文件：`order-service/src/test/java/com/o2o/hitch/order/controller/OrderControllerTest.java`
- 断言：非归属司机访问接单/完单接口时抛出业务异常。

### 用例3：司机行程绑定作用域
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/controller/TripControllerTest.java`
- 断言：司机绑定非本人 `driverId` 时抛出业务异常。

## 接口测试（手工）
1. 查询状态：`GET /api/drivers/{driverId}/availability`
2. 更新状态：`PUT /api/drivers/{driverId}/availability`

## 预期结果
1. 更新后返回最新状态。
2. 非司机/管理员更新请求返回角色拒绝错误。

## 执行记录
- 已执行 Maven 自动化测试：`mvn -s .mvn-local-settings.xml test`（2026-04-17），构建成功。
- 司机相关自动化测试结果：`DriverServiceTest` 1 项 + 跨模块作用域用例（`OrderControllerTest`、`TripControllerTest`）已通过，`Failures=0, Errors=0, Skipped=0`。
- 接口联调待服务启动后执行。
