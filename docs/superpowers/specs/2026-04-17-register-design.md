# 注册与自动登录设计

**日期：** 2026-04-17  
**范围：** auth-service + user-service + frontend

## 目标
- 支持用户自助注册，角色可选 `PASSENGER` 或 `DRIVER`
- 注册成功后直接返回 JWT 会话，前端自动进入对应业务首页

## 现状
- 前端登录页仅有“注册入口占位文案”
- `auth-service` 仅有 `/auth/login` 与 `/auth/me`
- `user-service` 仅开放管理员头 `X-User-Role=ADMIN` 的 `/users` upsert

## 方案
- 在 `auth-service` 新增 `POST /auth/register`
- `auth-service` 调用 `user-service` 内部注册接口完成建档
- 建档后由 `auth-service` 签发 token，返回结构与登录一致：`token/userId/role`
- 前端新增注册表单并调用 `api.register`，成功后复用 `loginSuccess` 状态流程

## 接口草案
### 1) Auth 注册
- 路径：`POST /auth/register`
- 入参：
  - `username`（非空）
  - `password`（非空）
  - `role`（非空，取值 `PASSENGER`/`DRIVER`）
  - `nickname`（非空）
  - `mobile`（非空）
- 出参：`{ token, userId, role }`
- 错误：
  - 角色非法：`ROLE_NOT_ALLOWED_FOR_REGISTER`
  - 用户名已存在：`USER_ALREADY_EXISTS`

### 2) User 内部注册
- 路径：`POST /users/internal/register`
- 入参：同上（`userId` 使用 auth 入参 `username`）
- 逻辑：
  - 若 userId 已存在 -> 抛 `USER_ALREADY_EXISTS`
  - 若 role 非 `PASSENGER/DRIVER` -> 抛 `ROLE_NOT_ALLOWED_FOR_REGISTER`
  - 否则保存并返回 profile（不含 password）

## 兼容性与边界
- 不改动现有 `/auth/login` 与 `/users` 管理员 upsert
- 默认种子账号仍可登录
- 注册返回角色统一大写，前端映射到 `passenger/driver`

## 测试策略（TDD）
- `auth-service`：
  - 新增注册成功测试（返回 role/token 字段）
  - 新增非法角色测试（抛业务异常）
- `user-service`：
  - 新增重复用户名测试
  - 新增非法角色测试
- `frontend`：
  - 登录页出现可提交注册表单
  - 提交注册成功后触发成功分支（API 层单测）

## 非目标
- 不实现短信验证码
- 不实现密码强度策略
- 不开放 ADMIN 自助注册
