# 乘客模块测试文档

## 测试目标
- 验证乘客资料查询与更新能力。

## 自动化测试
### 用例1：不存在乘客查询
- 文件：`passenger-service/src/test/java/com/o2o/hitch/passenger/service/PassengerServiceTest.java`
- 断言：抛出业务异常。

## 接口测试（手工）
1. 更新资料：`POST /api/passengers`
2. 查询资料：`GET /api/passengers/{id}`

## 预期结果
1. 更新成功后查询返回 `passengerId/level/emergencyContact`。
2. 非乘客/管理员更新请求返回角色拒绝错误。

## 执行记录
- 已执行 Maven 自动化测试：`mvn -s .mvn-local-settings.xml test`（2026-04-17），构建成功。
- 乘客相关自动化测试结果：`PassengerServiceTest` 共 1 项，`Failures=0, Errors=0, Skipped=0`。
- 接口联调待服务启动后执行。
