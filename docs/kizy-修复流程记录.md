# Kizy 修复流程记录（2026-04-17）
## 背景
- 现象：前端在 `http://localhost:5173` 执行步骤 1（乘客登录）时报错 `Failed to fetch`。
- 影响：无法拿到 token，后续联调步骤全部阻塞。

## 问题定位流程
1. 确认服务端口状态：
   - `5173`（前端）、`9000`（网关）、`8888`（配置中心）、`8761`（注册中心）均在监听。
2. 检查前端请求目标：
   - 前端 API 基地址为 `http://localhost:9000/api`。
3. 检查网关认证日志：
   - 发现浏览器预检请求 `OPTIONS /api/auth/login` 返回 `403 FORBIDDEN`。
4. 结论：
   - 属于 CORS 预检被拦截，不是业务登录接口本身故障。

## 修复方案
### 1) 网关鉴权过滤器放行预检请求
- 文件：`gateway-zuul/src/main/java/com/o2o/hitch/gateway/filter/AuthPreFilter.java`
- 改动：在 `shouldFilter()` 中对 `OPTIONS` 请求直接返回 `false`，不进入鉴权拦截。

### 2) 增加网关全局 CORS 配置
- 文件：`gateway-zuul/src/main/java/com/o2o/hitch/gateway/config/CorsConfig.java`
- 改动：
  - 允许来源：`*`
  - 允许方法：`GET, POST, PUT, DELETE, OPTIONS`
  - 允许请求头：`*`
  - 预检缓存：`3600s`

## 启动与验证
1. 执行启动脚本：
   - `bash ./scripts/start-all.sh --no-open --skip-install`
2. 验证预检请求：
   - `OPTIONS http://localhost:9000/api/auth/login` 返回 `200`。
3. 验证登录请求：
   - `POST /api/auth/login`（`passenger001 / 123456`）返回 `SUCCESS` 且包含 token。
4. 结果：
   - 前端步骤 1 可正常通过，`Failed to fetch` 问题消除。

## 本次变更清单
- `gateway-zuul/src/main/java/com/o2o/hitch/gateway/filter/AuthPreFilter.java`
- `gateway-zuul/src/main/java/com/o2o/hitch/gateway/config/CorsConfig.java`
- `docs/kizy-修复流程记录.md`


---

## 追加记录：启动后首轮登录返回 500（2026-04-17）
### 现象
- 前端第一步调用 `POST http://localhost:9000/api/auth/login`，偶发 `500 Internal Server Error`。
- 该问题通常发生在刚执行完 `start-all.sh` 后立即点击登录。

### 排查过程
1. 复核服务健康状态：
   - `http://localhost:5173`、`http://localhost:9000/actuator/health`、`http://localhost:8888/actuator/health`、`http://localhost:8761` 均可达。
2. 查看网关日志：
   - 发现关键报错：`Load balancer does not have available server for client: auth-service`。
3. 查看 Eureka 注册信息：
   - `http://localhost:8761/eureka/apps` 中可见 `AUTH-SERVICE`，但网关在启动早期存在注册感知延迟窗口。
4. 复测接口：
   - 待注册稳定后，`POST /api/auth/login` 恢复正常，业务账号可返回 `200`。

### 根因结论
- 不是前端参数问题，也不是 `auth-service` 业务逻辑异常。
- 根因是“启动窗口期网关尚未拿到 auth-service 可用实例”，导致首轮请求被 Zuul/Ribbon 返回 `500`。

### 修复策略
- 在启动脚本中增加“网关到鉴权路由就绪检查”。
- 判定规则：对 `POST /api/auth/login` 发送探测请求，只要返回 `2xx-4xx` 即视为路由可用；`5xx` 或不可达继续等待，超时则启动失败。
- 这样可以确保脚本提示“启动完成”时，前端第一步已可稳定执行，不再踩启动窗口。

### 代码改动
1. `scripts/start-all.ps1`
   - 新增函数：`Wait-GatewayAuthRouteReady`
   - 在 `gateway-zuul` 和 `auth-service` 健康检查后调用该函数。
2. `scripts/start-all.sh`
   - 新增函数：`wait_gateway_auth_route_ready`
   - 在同样阶段插入调用，保持非 WSL 与 WSL 委托模式行为一致。

### 验证步骤
1. 重启服务：
   - `bash ./scripts/stop-all.sh`
   - `bash ./scripts/start-all.sh --no-open`
2. 观察启动日志：
   - 出现 `Gateway route to auth-service is ready (status=...)` 后再进行前端操作。
3. 登录验证：
   - `passenger001 / 123456` 与 `driver001 / 123456` 均可返回 `200` 与 token。

### 本段新增变更清单
- `scripts/start-all.ps1`
- `scripts/start-all.sh`
- `docs/kizy-修复流程记录.md`

---

## 追加记录：注册功能打通（2026-04-17）
### 目标
- 新增用户自助注册能力，支持角色 `PASSENGER/DRIVER`。
- 注册成功后自动登录并跳转对应首页。

### 设计结论
- 采用 `auth-service` 作为统一注册入口（`POST /auth/register`）。
- `auth-service` 调用 `user-service` 内部注册接口建档。
- 建档成功后由 `auth-service` 直接签发 JWT，返回结构与登录一致（`token/userId/role`）。

### 后端改动
1. `auth-service`
   - 新增 `RegisterRequest` DTO。
   - `AuthController` 新增 `POST /auth/register`。
   - `AuthService` 新增 `register(...)`：
     - 校验参数；
     - 限制注册角色仅 `PASSENGER/DRIVER`；
     - 调用 `AuthUserClient.registerInternal(...)`；
     - 统一签发 token 并返回会话信息。
   - `AuthUserClient` / `AuthUserClientFallback` 增加 `registerInternal` 方法。

2. `user-service`
   - `UserController` 新增 `POST /users/internal/register`。
   - `UserService` 新增 `register(...)`：
     - 校验角色白名单（`PASSENGER/DRIVER`）；
     - 校验用户名唯一，重复时报 `USER_ALREADY_EXISTS`。

### 前端改动
1. `frontend/src/api/index.ts`
   - 增加 `api.register(username, password, role, nickname, mobile)`，请求 `/auth/register`。

2. `frontend/src/app/auth/LandingPage.tsx`
   - 将原“注册占位提示”替换为可提交注册表单。
   - 支持注册身份切换（乘客/司机）。
   - 注册成功后复用 `loginSuccess`，自动进入对应业务首页。

### 测试与验证
1. 后端认证模块：
   - 命令：`mvn -pl auth-service -am -Dtest=AuthServiceTest "-Dsurefire.failIfNoSpecifiedTests=false" test`
   - 结果：`BUILD SUCCESS`，`Tests run: 4, Failures: 0, Errors: 0`。

2. 后端用户模块：
   - 命令：`mvn -pl user-service -am -Dtest=UserServiceTest "-Dsurefire.failIfNoSpecifiedTests=false" test`
   - 结果：`BUILD SUCCESS`，`Tests run: 4, Failures: 0, Errors: 0`。

3. 前端注册相关：
   - 命令：`npm --prefix frontend test -- api.spec.ts routing.spec.tsx`
   - 结果：`2 passed`，`3 passed`。

### 本段新增变更清单
- `auth-service/src/main/java/com/o2o/hitch/auth/dto/RegisterRequest.java`
- `auth-service/src/main/java/com/o2o/hitch/auth/controller/AuthController.java`
- `auth-service/src/main/java/com/o2o/hitch/auth/service/AuthService.java`
- `auth-service/src/main/java/com/o2o/hitch/auth/client/AuthUserClient.java`
- `auth-service/src/main/java/com/o2o/hitch/auth/client/AuthUserClientFallback.java`
- `auth-service/src/test/java/com/o2o/hitch/auth/service/AuthServiceTest.java`
- `user-service/src/main/java/com/o2o/hitch/user/controller/UserController.java`
- `user-service/src/main/java/com/o2o/hitch/user/service/UserService.java`
- `user-service/src/test/java/com/o2o/hitch/user/service/UserServiceTest.java`
- `frontend/src/api/index.ts`
- `frontend/src/app/auth/LandingPage.tsx`
- `frontend/src/__tests__/api.spec.ts`
- `frontend/src/__tests__/routing.spec.tsx`
- `docs/kizy-修复流程记录.md`
