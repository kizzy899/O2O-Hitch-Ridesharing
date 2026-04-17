# 用户模块测试文档

## 测试目标
- 验证用户查询、用户登记与角色访问控制。

## 自动化测试
### 用例1：不存在用户查询
- 文件：`user-service/src/test/java/com/o2o/hitch/user/service/UserServiceTest.java`
- 断言：查询不存在用户抛出业务异常。

## 接口测试（手工）
1. 管理员创建用户：`POST /api/users`
2. 查询用户：`GET /api/users/{userId}`

## 预期结果
1. 创建成功返回 `userId/role/nickname/mobile`。
2. 查询成功返回同一用户资料。
3. 非管理员访问 `POST /api/users` 返回角色拒绝错误。

## 执行记录
- 已执行 Maven 自动化测试：`mvn -s .mvn-local-settings.xml test`（2026-04-17），构建成功。
- 用户相关自动化测试结果：`UserServiceTest` 共 1 项，`Failures=0, Errors=0, Skipped=0`。
- 接口联调待服务启动后执行。
