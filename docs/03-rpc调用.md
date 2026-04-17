# 03 RPC 调用

## 本阶段目标
- 通过 OpenFeign 建设跨服务业务调用链。
- 在主链路中落地认证、用户、司机、行程联动能力。

## 涉及模块
- `auth-service`
- `trip-service`
- `order-service`
- `user-service`
- `driver-service`
- `passenger-service`

## 对应关键代码位置
- `auth-service/src/main/java/com/o2o/hitch/auth/client/AuthUserClient.java`
- `trip-service/src/main/java/com/o2o/hitch/trip/client/UserClient.java`
- `trip-service/src/main/java/com/o2o/hitch/trip/client/PassengerClient.java`
- `order-service/src/main/java/com/o2o/hitch/order/client/DriverClient.java`
- `order-service/src/main/java/com/o2o/hitch/order/client/TripClient.java`

## 核心类与配置说明
- `auth-service` 登录时通过 Feign 查询用户认证资料。
- `trip-service` 发布行程时通过 Feign 查询用户展示信息。
- `trip-service` 发布行程前通过 Feign 校验乘客档案存在性。
- `order-service` 创建订单时通过 Feign 校验行程信息与司机状态。
- `order-service` 接单时通过 Feign 调用行程服务推进状态到 `ORDER_ACCEPTED`，并调用司机服务将可接单状态更新为 `false`。
- 所有调用链均配置 fallback 作为兜底。

## 关键接口说明
1. `GET /users/internal/{userId}/auth-profile`
2. `GET /users/{userId}`
3. `GET /passengers/internal/{passengerId}`
4. `GET /drivers/internal/{driverId}/availability`
5. `PUT /drivers/internal/{driverId}/availability/{available}`
6. `GET /trips/{tripId}`
7. `POST /trips/internal/{tripId}/order-accepted`

## 模块之间调用关系
- `auth-service -> user-service`
- `trip-service -> passenger-service`
- `trip-service -> user-service`
- `order-service -> trip-service`
- `order-service -> driver-service`

## 文字版流程说明
1. 业务服务接收请求后发起 Feign 调用。
2. 下游可用时返回真实结果。
3. 下游异常时走 fallback 并返回可控响应。

## 本阶段能力结果
- 服务间调用链覆盖认证与核心业务路径，并具备基础容错能力。
