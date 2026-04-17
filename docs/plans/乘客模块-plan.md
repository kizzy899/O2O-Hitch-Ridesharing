# 2026-04-17 Kizy 乘客模块计划

> **执行说明：** 实施前先创建计划文档 docs/plans/乘客模块-plan.md，并以本计划为准；若接口、字段映射、权限口径或测试门槛变化，必须先更新计划文档再继续实施。

## Summary

- 目标：建设乘客资料登记、查询与角色控制能力，支撑行程模块的乘客档案校验。
- 已确认策略：
  - 统一返回体采用 `ApiResponse(code/message/data/timestamp/traceId)`。
  - 对外接口经网关以 `/api/passengers/**` 暴露，服务内部保留 `/passengers/internal/**` 供模块间调用。
  - 写接口执行角色边界控制：仅 `PASSENGER` 与 `ADMIN` 可调用更新。

## Key Changes

- 前端：
  - 通过 `frontend/src/api/index.ts` 约定乘客资料查询与更新请求路径。
- 后端/API：
  - 关键代码位置：`passenger-service/src/main/java/com/o2o/hitch/passenger/controller/PassengerController.java`、`passenger-service/src/main/java/com/o2o/hitch/passenger/service/PassengerService.java`、`passenger-service/src/main/java/com/o2o/hitch/passenger/dto/PassengerRequest.java`
  - 关键实现：新增/维护乘客资料存储与查询，补齐参数校验与角色校验。
- 数据与映射：
  - 请求体 `passengerId/level/emergencyContact` -> 乘客资料模型 -> 查询结果字段一致回传。
- 边界保护（不改动范围）：
  - 不改动订单、行程模块业务编排逻辑。
  - 不引入数据库迁移与额外中间件，保持当前课程演示最小实现。

## Public Interfaces

- 新增/变更接口：
  - `POST /api/passengers`
  - `GET /api/passengers/{id}`
  - `GET /passengers/internal/{id}`
- 新增/变更类型：
  - `PassengerRequest`、`PassengerController`、`PassengerService`、`PassengerException`
- 接口约束说明：
  - `POST /api/passengers` 需要 `X-User-Role`，仅 `PASSENGER`/`ADMIN` 允许提交。
  - `GET /passengers/internal/{id}` 用于服务内调用，不作为对外公开接口。

## Data Mapping

- UI 字段 -> API 参数：
  - 乘客资料维护页字段映射为 `passengerId`、`level`、`emergencyContact`。
- API 参数 -> 业务字段：
  - `PassengerRequest` 通过校验后写入乘客资料存储，作为行程发布前的档案基础数据。
- 查询结果 -> 页面展示：
  - 查询接口返回 `passengerId/level/emergencyContact`，页面按原字段名渲染。

## Test Plan

- 定向测试：
  - `PassengerServiceTest` 覆盖不存在乘客查询异常场景。
- 回归测试：
  - 覆盖乘客资料更新后查询一致性、角色越权更新拒绝。
- 构建验证：
  - `mvn -s .mvn-local-settings.xml -pl passenger-service test`
- 全量测试：
  - `mvn -s .mvn-local-settings.xml test`
- 手工验收：
  - 启动网关与乘客服务后，按 `docs/接口清单.md` 对 `POST /api/passengers`、`GET /api/passengers/{id}` 执行联调验证。

## Assumptions

- 当前以内存存储承载乘客资料，后续如接入持久化保持接口契约不变。
- 读取接口暂不追加乘客身份强约束，优先保障与现有行程模块内部校验链路兼容。
