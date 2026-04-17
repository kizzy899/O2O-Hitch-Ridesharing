# 01 Java Web 开发

## 本阶段目标
- 采用 Spring MVC 风格统一建设 RESTful API。
- 建立统一返回体、全局异常处理、基础参数校验、traceId 机制。

## 涉及模块
- `common`
- `auth-service`
- `user-service`
- `driver-service`
- `passenger-service`
- `trip-service`
- `order-service`

## 对应关键代码位置
- `common/src/main/java/com/o2o/hitch/common/api/ApiResponse.java`
- `common/src/main/java/com/o2o/hitch/common/web/GlobalExceptionHandler.java`
- `common/src/main/java/com/o2o/hitch/common/web/TraceIdFilter.java`
- 各服务 `controller` 与 `service` 包

## 核心类与配置说明
- `ApiResponse`：统一响应结构，提供 success/fail 工厂方法。
- `BusinessException` + `GlobalExceptionHandler`：统一异常出口。
- `TraceIdFilter`：请求级追踪 ID。
- 各控制器使用 `@RestController` + `@RequestMapping` 暴露 REST 接口。

## 关键接口说明
- `POST /api/auth/login`
- `GET /api/users/{userId}`
- `GET /api/drivers/{driverId}/availability`
- `POST /api/trips`
- `POST /api/orders/create`

## 模块之间调用关系
- 外部请求统一进入网关，网关转发到业务服务控制器。
- 控制器调用服务层完成业务编排。
- 服务层在必要场景调用 Feign Client。

## 文字版流程说明
1. 客户端请求进入网关。
2. 网关透传请求到目标服务。
3. 控制器接收参数并调用 service。
4. service 处理业务并返回结果。
5. 全局异常统一转换为标准错误返回。

## 本阶段完成后系统获得了什么能力
- 获得统一 API 规范、统一错误语义、统一返回结构，为后续微服务治理打基础。
