# 认证模块测试文档

## 测试目标
- 验证登录鉴权与身份回读能力。

## 自动化测试
### 用例1：密码错误
- 文件：`auth-service/src/test/java/com/o2o/hitch/auth/service/AuthServiceTest.java`
- 断言：抛出业务异常。

### 用例2：角色映射
- 文件：`auth-service/src/test/java/com/o2o/hitch/auth/service/AuthServiceTest.java`
- 断言：登录结果中的 `role` 与用户资料一致。

## 接口测试（手工）
1. 登录：`POST /api/auth/login`
2. 身份查询：`GET /api/auth/me`

## 预期结果
1. 正确账号密码返回 `token/userId/role`。
2. 错误密码返回 `USERNAME_OR_PASSWORD_INVALID`。
3. `me` 返回与 token 一致的身份信息。

## 执行记录
- 已执行 Maven 自动化测试：`mvn -s .mvn-local-settings.xml test`（2026-04-17），构建成功。
- 认证相关自动化测试结果：`AuthServiceTest` 共 2 项，`Failures=0, Errors=0, Skipped=0`。
- 接口联调待服务启动后执行。
