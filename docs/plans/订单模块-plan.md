# 订单模块建设计划

## 阶段目标
- 建设订单创建、接单、完成、取消、查询能力，打通完整订单状态闭环。
- 建设订单列表查询能力，支持按角色范围与状态筛选。

## 模块建设范围
- 服务：`order-service`
- 依赖：`trip-service`（Feign）、`driver-service`（Feign）、Ribbon（负载均衡演示）

## 能力实现清单
1. 新增 `OrderRequest` 参数对象，提供基础参数校验。
2. 在 `OrderService` 内建设订单状态与时间字段管理。
3. 订单创建前增加行程校验：行程存在、乘客一致、行程状态允许。
4. 订单创建前增加司机可接单状态校验。
5. 订单接单时联动行程状态推进到 `ORDER_ACCEPTED`，并将司机可接单状态更新为 `false`。
6. 订单完成时联动行程状态推进到 `ORDER_COMPLETED`，并将司机可接单状态恢复为 `true`。
7. 订单取消时联动行程状态推进到 `ORDER_CANCELLED`，已接单场景恢复司机可接单状态为 `true`。
8. 订单查询接口返回真实已创建订单数据。
9. 订单列表查询支持 `userId + status` 过滤。
10. 保留 `lb-check` 作为 Ribbon 命中演示入口。
11. 在控制器层增加用户作用域校验：普通角色仅可创建/查询本人订单，管理员可跨用户。
12. 在接单、完成、取消、详情查询接口增加订单归属校验：司机仅可操作本人订单，乘客仅可操作本人订单，管理员可跨用户。

## 接口说明
1. `POST /api/orders/create`
2. `POST /api/orders/{id}/accept`
3. `POST /api/orders/{id}/complete`
4. `POST /api/orders/{id}/cancel`
5. `GET /api/orders/{id}`
6. `GET /api/orders?userId=xxx&status=xxx`
7. `GET /api/orders/lb-check`

## 测试设计
1. 订单创建后状态应为 `PENDING_ACCEPT`。
2. 行程乘客不一致时创建应失败。
3. 订单接单后状态应为 `ACCEPTED`，`tripStatus` 为 `ORDER_ACCEPTED`，`driverAvailable=false`。
4. 订单完成后状态应为 `COMPLETED`，`tripStatus` 为 `ORDER_COMPLETED`，`driverAvailable=true`。
5. 订单取消后状态应为 `CANCELLED`，`tripStatus` 为 `ORDER_CANCELLED`。
6. 订单列表查询可按角色范围和状态过滤。
7. 非管理员查询他人订单时应被拒绝。
8. 非管理员操作他人订单（接单/完成/取消/详情）时应被拒绝。

## 结果验证
- 已更新 `OrderServiceTest` 覆盖创建成功、乘客不一致失败、接单/完成/取消联动场景。
- 受环境限制，待 Maven 可用后执行模块自动化测试与联调测试。
