# 2026-04-17 Kizy 司机模块计划

> **执行说明：** 实施前先创建计划文档 docs/plans/司机模块-plan.md，并以本计划为准；若接口、状态联动、权限口径或测试门槛变化，必须先更新计划文档再继续实施。

## Summary

- 目标：建设司机可接单状态查询与更新能力，支撑订单创建、接单、完单、取消过程中的状态联动。
- 已确认策略：
  - 统一返回体采用 `ApiResponse(code/message/data/timestamp/traceId)`。
  - 对外接口经网关以 `/api/drivers/**` 暴露，内部接口通过 `/drivers/internal/**` 供订单服务调用。
  - 角色控制与作用域校验协同：司机服务控制更新角色，订单/行程模块补充归属与司机本人作用域校验。

## Key Changes

- 前端：
  - 通过 `frontend/src/api/index.ts` 约定司机可接单状态查询与更新请求路径。
- 后端/API：
  - 关键代码位置：`driver-service/src/main/java/com/o2o/hitch/driver/controller/DriverController.java`、`driver-service/src/main/java/com/o2o/hitch/driver/service/DriverService.java`、`driver-service/src/main/java/com/o2o/hitch/driver/dto/DriverRequest.java`
  - 联动代码位置：`order-service/src/main/java/com/o2o/hitch/order/service/OrderService.java`、`order-service/src/main/java/com/o2o/hitch/order/controller/OrderController.java`、`trip-service/src/main/java/com/o2o/hitch/trip/controller/TripController.java`
  - 关键实现：司机可接单状态维护、订单服务内部置忙/恢复、归属司机操作限制。
- 数据与映射：
  - 请求体 `available` -> 司机状态存储 -> 订单返回中的 `driverAvailable` 字段。
- 边界保护（不改动范围）：
  - 不改动订单状态机定义，仅接入司机状态联动。
  - 不新增司机档案管理字段，聚焦可接单状态能力。

## Public Interfaces

- 新增/变更接口：
  - `GET /api/drivers/{driverId}/availability`
  - `PUT /api/drivers/{driverId}/availability`
  - `GET /drivers/internal/{driverId}/availability`
  - `PUT /drivers/internal/{driverId}/availability/{available}`
- 新增/变更类型：
  - `DriverRequest`、`DriverController`、`DriverService`、`DriverException`
- 接口约束说明：
  - `PUT /api/drivers/{driverId}/availability` 需要 `X-User-Role`，仅 `DRIVER`/`ADMIN` 允许。
  - 内部接口仅供服务间调用，不作为外部客户端直接调用入口。

## Data Mapping

- UI 字段 -> API 参数：
  - 司机端可接单开关映射为 `available` 布尔值。
- API 参数 -> 业务字段：
  - `DriverRequest.available` 写入司机状态存储，并在订单联动结果中体现。
- 查询结果 -> 页面展示：
  - `driverId/available` 直接映射司机端状态展示组件。

## Test Plan

- 定向测试：
  - `DriverServiceTest` 覆盖司机状态更新后查询一致性。
- 回归测试：
  - `OrderControllerTest` 覆盖司机订单操作作用域校验。
  - `TripControllerTest` 覆盖司机绑定非本人 `driverId` 的拒绝逻辑。
- 构建验证：
  - `mvn -s .mvn-local-settings.xml -pl driver-service test`
- 全量测试：
  - `mvn -s .mvn-local-settings.xml test`
- 手工验收：
  - 启动网关后，按 `docs/接口清单.md` 联调司机状态查询/更新与订单接单联动结果。

## Assumptions

- 当前以 `driverId` 作为司机身份唯一键，默认演示账号可通过初始化数据直接参与联调。
- 司机状态存储为内存实现，后续切换持久化时保持接口与状态语义不变。
