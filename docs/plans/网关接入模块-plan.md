# 2026-04-16 Kizy 网关接入模块计划

> **执行说明：** 实施前先创建计划文档 docs/plans/网关接入模块-plan.md，并以本计划为准；若交互、接口、数据映射、权限口径或测试门槛变化，必须先更新计划文档再继续实施。

## Summary

- 目标：实现统一入口路由、JWT 校验、角色拦截、请求头透传
- 已确认策略：
  - 采用统一返回体 ApiResponse(code/message/data/timestamp/traceId)。
  - 请求统一经 gateway-zuul 进入，权限由网关与服务共同保障。
  - 配置统一由 config-server + config-repo(native) 管理。

## Key Changes

- 前端：
  - 通过 rontend/src/api/index.ts 约定网关接口地址。
- 后端/API：
  - 关键代码位置：gateway-zuul/src/main/java/com/o2o/hitch/gateway/filter/AuthPreFilter.java, config-repo/gateway-zuul.yml
  - 关键接口：Gateway prefix /api/** -> route to services
- 数据与映射：
  - Authorization -> JwtClaims(userId,role) -> X-User-Id/X-User-Role
- 边界保护（不改动范围）：
  - 不修改仓库既有历史目录代码。
  - 不引入额外中间件，保持课程演示最小可运行集合。

## Public Interfaces

- 新增/变更接口：
  - Gateway prefix /api/** -> route to services
- 新增/变更类型：
  - DTO/VO/Entity/Config/Exception 目录骨架已在服务模块补齐。
- 接口约束说明：
  - 统一入口保持 /api/**，不直接暴露服务内部端口给调用方。

## Data Mapping

- UI 字段 -> API 参数：
  - 前端请求体与路径参数由 rontend/src/api/index.ts 约定。
- API 参数 -> 业务字段：
  - Authorization -> JwtClaims(userId,role) -> X-User-Id/X-User-Role
- 查询结果 -> 页面展示：
  - 标准返回体中 data 字段承载业务对象，message 与 code 用于提示与分支处理。

## Test Plan

- 定向测试：
  - curl http://localhost:9000/api/orders/ORDER-1 无 token 应返回 401
- 回归测试：
  - 登录、鉴权、网关转发、统一异常返回体。
- 构建验证：
  - mvn -s .mvn-local-settings.xml -pl common test（已于 2026-04-17 执行通过）。
- 全量测试：
  - mvn -s .mvn-local-settings.xml test（已于 2026-04-17 执行通过）。
- 手工验收：
  - 按 docs/演示手册.md 执行端到端演示并核对响应结构。

## Assumptions

- 开放路径限定为 /api/auth/login 与健康检查接口
- 当前优先保证结构标准、职责清晰、可讲解可验证；复杂业务规则后续可按同模板扩展。
