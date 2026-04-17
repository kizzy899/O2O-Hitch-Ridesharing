# Kizy 修复流程记录（2026-04-17）

## 背景
- 现象：前端在 `http://localhost:5173` 执行步骤 1（乘客登录）时报错 `Failed to fetch`。
- 影响：无法拿到 token，后续联调步骤全部阻塞。

## 问题定位流程
1. 确认服务端口状态：
   - `5173`（前端）、`9000`（网关）、`8888`（配置中心）、`8761`（注册中心）均在监听。
2. 检查前端请求目标：
   - 前端 API 基地址为 `http://localhost:9000/api`。
3. 检查网关/认证日志：
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

