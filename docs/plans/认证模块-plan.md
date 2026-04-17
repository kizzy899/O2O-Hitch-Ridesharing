# 2026-04-17 Kizy 认证模块计划

> **执行说明：** 实施前先创建计划文档 docs/plans/认证模块-plan.md，并以本计划为准；若认证口径、令牌字段、下游依赖或测试门槛变化，必须先更新计划文档再继续实施。

## Summary

- 目标：建设统一登录鉴权与身份回读能力，打通认证服务与用户服务认证资料联动。
- 已确认策略：
  - 统一返回体采用 `ApiResponse(code/message/data/timestamp/traceId)`。
  - 登录成功签发 JWT，`claims` 至少包含 `userId` 与 `role`。
  - 网关负责后续请求验签并透传 `X-User-Id/X-User-Role`，业务服务按角色和作用域执行授权。

## Key Changes

- 前端：
  - 通过 `frontend/src/api/index.ts` 约定 `POST /api/auth/login` 与 `GET /api/auth/me` 调用入口。
- 后端/API：
  - 关键代码位置：`auth-service/src/main/java/com/o2o/hitch/auth/controller/AuthController.java`、`auth-service/src/main/java/com/o2o/hitch/auth/service/AuthService.java`、`auth-service/src/main/java/com/o2o/hitch/auth/client/AuthUserClient.java`
  - 依赖与兜底：`auth-service/src/main/java/com/o2o/hitch/auth/client/AuthUserClientFallback.java`
  - 关键实现：账号口令校验、JWT 签发与解析、下游异常兜底返回。
- 数据与映射：
  - `username/password` -> 用户认证资料校验 -> 登录结果 `token/userId/role`。
- 边界保护（不改动范围）：
  - 不修改网关过滤器核心鉴权流程，仅确保认证服务输出契约稳定。
  - 不扩展多端登录态与刷新令牌机制，保持当前阶段最小闭环。

## Public Interfaces

- 新增/变更接口：
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /users/internal/{userId}/auth-profile`（认证服务内部依赖接口）
- 新增/变更类型：
  - `AuthRequest`、`AuthController`、`AuthService`、`AuthUserClient`、`AuthUserClientFallback`、`AuthException`
- 接口约束说明：
  - `POST /api/auth/login` 仅接受合法 `username/password`。
  - `GET /api/auth/me` 必须携带 `Authorization` 请求头，并能解析为有效 token。

## Data Mapping

- UI 字段 -> API 参数：
  - 登录表单字段映射为 `username`、`password`。
- API 参数 -> 业务字段：
  - `username` 对应用户主键，调用用户服务获取 `password/role` 并进行匹配。
  - 校验通过后签发 token，载荷包含 `userId(username)` 与 `role`。
- 查询结果 -> 页面展示：
  - 登录成功返回 `token/userId/role`；`me` 接口返回当前身份信息用于前端鉴权态恢复。

## Test Plan

- 定向测试：
  - `AuthServiceTest` 覆盖密码错误登录失败与登录成功角色映射。
- 回归测试：
  - 覆盖 token 解析回读、下游依赖异常兜底逻辑。
- 构建验证：
  - `mvn -s .mvn-local-settings.xml -pl auth-service test`
- 全量测试：
  - `mvn -s .mvn-local-settings.xml test`
- 手工验收：
  - 按 `docs/07-统一认证与授权.md` 与 `docs/接口清单.md` 完成登录、鉴权透传、身份回读联调。

## Assumptions

- 当前 token 过期策略以配置项 `expireSeconds` 为准，不在本阶段扩展刷新机制。
- 用户认证资料来源统一为 `user-service`，fallback 仅作为下游不可用时的可控失败保障，不替代真实认证数据。
