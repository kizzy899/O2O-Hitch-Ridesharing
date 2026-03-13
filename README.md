# O2O 同城顺风车

一个包含后端微服务、H5 页面和微信小程序的同城顺风车示例项目。

## 目录结构

- `backend/`：Java 微服务后端，包含网关、用户、行程、订单、支付、通知、存储等模块
- `web/`：H5 页面资源
- `wechatapp/`：微信小程序代码
- `docker-compose.yml`：本地依赖服务编排
- `nginx.conf`：Nginx 配置
- `hitch.sql`：数据库初始化脚本

## 后端模块

`backend/pom.xml` 为聚合工程，主要模块包括：

- `hitch-gateway`
- `hitch-account`
- `hitch-stroke`
- `hitch-order`
- `hitch-payment`
- `hitch-notice`
- `hitch-storage`
- `hitch-commons`
- `hitch-modules`

## 快速开始

### 1. 准备环境

- JDK 8+
- Maven 3.6+
- MySQL
- Redis
- Nacos
- RabbitMQ
- MinIO（如使用文件存储功能）

### 2. 初始化数据库

执行根目录下的 `hitch.sql`。

### 3. 启动依赖服务

如本项目环境适配完成，可根据需要使用：

```bash
docker-compose up -d
```

### 4. 启动后端服务

进入 `backend/` 后执行：

```bash
mvn clean install
```

然后按需启动各个微服务模块。

## 说明

- 仓库当前主分支为 `main`
- 本仓库已重新初始化为全新 Git 历史，并已关联 GitHub 仓库 `kizzy899/O2O`
