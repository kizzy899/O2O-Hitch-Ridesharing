# 行程模块建设计划

## 阶段目标
- 建设行程发布、查询、绑定司机与订单状态联动推进能力。
- 建设行程列表查询能力，支持按乘客与状态筛选。

## 模块建设范围
- 服务：`trip-service`
- 依赖：`user-service`（Feign）、`order-service`（内部联动）

## 能力实现清单
1. 行程发布后状态为 `PUBLISHED`。
2. 司机绑定后状态为 `MATCHED`。
3. 订单接单后内部推进状态为 `ORDER_ACCEPTED`。
4. 订单完成后内部推进状态为 `ORDER_COMPLETED`。
5. 订单取消后内部推进状态为 `ORDER_CANCELLED`。
6. 行程列表查询支持 `passengerId + status` 过滤。
7. 在控制器层增加用户作用域校验：普通乘客仅可发布/查询本人行程，管理员可跨用户。
8. 在行程详情查询接口执行行程归属校验，阻止普通角色读取他人行程。
9. 在司机绑定行程接口执行司机作用域校验，阻止司机绑定非本人 `driverId`。

## 接口说明
1. `POST /api/trips`
2. `GET /api/trips/{id}`
3. `GET /api/trips?passengerId=xxx&status=xxx`
4. `POST /api/trips/{id}/match-driver`
5. `POST /trips/internal/{id}/order-accepted`
6. `POST /trips/internal/{id}/order-completed`
7. `POST /trips/internal/{id}/order-cancelled`

## 测试设计
1. 发布后状态为 `PUBLISHED`。
2. 订单接单推进后状态为 `ORDER_ACCEPTED`。
3. 完成/取消推进后状态正确。
4. 行程列表查询可按乘客与状态过滤。
5. 非管理员查询或提交他人行程数据时应被拒绝。
6. 非管理员查询他人行程详情时应被拒绝。
7. 非管理员绑定他人 `driverId` 时应被拒绝。

## 结果验证
- 已更新服务实现并与订单服务联动。
- 受环境限制，待 Maven 可用后执行模块自动化测试与联调测试。
