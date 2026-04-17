# 订单模块测试文档

## 测试目标
- 验证订单创建、接单、完成、取消、查询与状态流转。
- 验证订单列表查询筛选能力。

## 自动化测试
### 用例1：创建订单状态
- 文件：`order-service/src/test/java/com/o2o/hitch/order/service/OrderServiceTest.java`
- 断言：创建后状态为 `PENDING_ACCEPT`。

### 用例2：行程乘客一致性
- 文件：`order-service/src/test/java/com/o2o/hitch/order/service/OrderServiceTest.java`
- 断言：当行程归属乘客与请求乘客不一致时抛出业务异常。

### 用例3：接单联动
- 文件：`order-service/src/test/java/com/o2o/hitch/order/service/OrderServiceTest.java`
- 断言：接单后 `status=ACCEPTED`、`tripStatus=ORDER_ACCEPTED`、`driverAvailable=false`。

### 用例4：完成联动
- 文件：`order-service/src/test/java/com/o2o/hitch/order/service/OrderServiceTest.java`
- 断言：完成后 `status=COMPLETED`、`tripStatus=ORDER_COMPLETED`、`driverAvailable=true`。

### 用例5：取消联动
- 文件：`order-service/src/test/java/com/o2o/hitch/order/service/OrderServiceTest.java`
- 断言：取消后 `status=CANCELLED`、`tripStatus=ORDER_CANCELLED`。

### 用例6：订单列表筛选
- 文件：`order-service/src/test/java/com/o2o/hitch/order/service/OrderServiceTest.java`
- 断言：按 `role + userId + status` 组合查询返回正确结果。

### 用例7：订单作用域校验
- 文件：`order-service/src/test/java/com/o2o/hitch/order/controller/OrderControllerTest.java`
- 断言：普通乘客提交/查询他人订单数据时抛出业务异常；管理员可跨用户查询。

### 用例8：司机订单操作作用域
- 文件：`order-service/src/test/java/com/o2o/hitch/order/controller/OrderControllerTest.java`
- 断言：司机接单/完成他人订单时抛出业务异常，仅订单归属司机可操作。

### 用例9：订单详情作用域
- 文件：`order-service/src/test/java/com/o2o/hitch/order/controller/OrderControllerTest.java`
- 断言：普通角色查询他人订单详情时抛出业务异常。

## 接口测试（手工）
1. 创建订单：`POST /api/orders/create`
2. 司机接单：`POST /api/orders/{id}/accept`
3. 司机完成：`POST /api/orders/{id}/complete`
4. 取消订单：`POST /api/orders/{id}/cancel`
5. 查询订单：`GET /api/orders/{id}`
6. 订单列表：`GET /api/orders?userId=xxx&status=xxx`
7. 越权接单验证：`POST /api/orders/{id}/accept`（使用非归属司机 token）

## 预期结果
1. 创建接口返回 `PENDING_ACCEPT`。
2. 接单接口返回 `ACCEPTED` 且司机置忙。
3. 完成接口返回 `COMPLETED` 且司机恢复可接单。
4. 取消接口返回 `CANCELLED`。

## 执行记录
- 已执行 Maven 自动化测试：`mvn -s .mvn-local-settings.xml test`（2026-04-17），构建成功。
- 订单相关自动化测试结果：`OrderServiceTest` 6 项 + `OrderControllerTest` 7 项，共 13 项，`Failures=0, Errors=0, Skipped=0`。
- 接口联调待服务启动后执行。
