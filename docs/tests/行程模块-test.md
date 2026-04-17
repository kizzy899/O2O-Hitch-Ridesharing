# 行程模块测试文档

## 测试目标
- 验证行程发布、查询、状态推进能力。
- 验证行程列表查询筛选能力。

## 自动化测试
### 用例1：发布行程状态
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/service/TripServiceTest.java`
- 断言：发布后状态为 `PUBLISHED`。

### 用例2：发布时间字段
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/service/TripServiceTest.java`
- 断言：发布后 `createdAt` 非空。

### 用例3：接单状态推进
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/service/TripServiceTest.java`
- 断言：内部推进后状态为 `ORDER_ACCEPTED`。

### 用例4：行程列表筛选
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/service/TripServiceTest.java`
- 断言：按 `passengerId + status` 查询返回正确行程集合。

### 用例5：行程作用域校验
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/controller/TripControllerTest.java`
- 断言：普通乘客提交/查询他人行程数据时抛出业务异常；管理员可跨用户查询。

### 用例6：行程详情作用域
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/controller/TripControllerTest.java`
- 断言：普通乘客查询他人行程详情时抛出业务异常；管理员可跨用户查询详情。

### 用例7：司机绑定作用域
- 文件：`trip-service/src/test/java/com/o2o/hitch/trip/controller/TripControllerTest.java`
- 断言：司机绑定非本人 `driverId` 时抛出业务异常；管理员可跨用户绑定。

## 接口测试（手工）
1. 登录获取 token：`POST /api/auth/login`
2. 发布行程：`POST /api/trips`
3. 查询行程：`GET /api/trips/{id}`
4. 行程列表：`GET /api/trips?passengerId=xxx&status=xxx`
5. 绑定司机：`POST /api/trips/{id}/match-driver?driverId=driver001`
6. 越权详情查询：`GET /api/trips/{id}`（使用非归属乘客 token）
7. 越权司机绑定：`POST /api/trips/{id}/match-driver?driverId=driver002`（使用 `driver001` token）

## 预期结果
1. 发布接口返回 `status=PUBLISHED`。
2. 查询接口返回与发布一致的 `tripId`。
3. 订单接单后再次查询行程应为 `status=ORDER_ACCEPTED`。

## 执行记录
- 已执行 Maven 自动化测试：`mvn -s .mvn-local-settings.xml test`（2026-04-17），构建成功。
- 行程相关自动化测试结果：`TripServiceTest` 4 项 + `TripControllerTest` 7 项，共 11 项，`Failures=0, Errors=0, Skipped=0`。
- 接口联调待服务启动后执行。
