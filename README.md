# O2O-Hitch-Ridesharing

本仓库已完成结构重组：微服务项目已提升为仓库根项目。

## 目录功能说明

### 核心业务目录

- `auth-service/`：统一认证服务，负责登录、JWT 签发与鉴权能力。
- `user-service/`：用户基础信息服务（账号、资料等）。
- `driver-service/`：司机侧业务服务（司机档案、司机能力接口等）。
- `passenger-service/`：乘客侧业务服务（乘客档案、乘客能力接口等）。
- `trip-service/`：行程服务，负责行程发布、查询与状态流转。
- `order-service/`：订单服务，负责下单、订单生命周期与订单查询。
- `gateway-zuul/`：网关服务，统一入口、路由转发与网关层过滤。
- `eureka-server/`：服务注册与发现中心。
- `config-server/`：配置中心服务，提供集中化配置下发。
- `config-repo/`：配置中心读取的配置仓库（native 模式配置文件）。
- `common/`：公共模块，沉淀通用响应体、异常、安全、过滤器等复用能力。
- `db/`：数据库初始化脚本目录（如 `init.sql`）。
- `docs/`：项目文档目录（规范、设计、测试、演示、验收映射等）。
- `scripts/`：一键启动脚本与运维辅助脚本。
- `frontend/`：前端示例工程（用于联调或演示）。

### 根目录关键文件

- `pom.xml`：Maven 聚合根 POM，统一管理全部微服务模块。
- `README.md`：项目总说明（当前文件）。
- `.gitignore`：Git 忽略规则。

### 非业务辅助目录（可按团队需要保留）

- `tools/`：本地工具目录（例如 Maven 二进制）。
- `tmp/`：临时文件目录。
- `skills/`：本地技能/脚本资源目录。
- `.idea/`、`.vscode/`：IDE 工程配置。
- `.edge-profile/`、`.edge-shot-profile/`：本地浏览器缓存/运行目录。

## 构建与启动

### 构建

```powershell
tools/apache-maven-3.9.11/bin/mvn.cmd -f pom.xml -DskipTests compile
```

### 启动（Windows）

```powershell
./scripts/start-all.ps1
```

脚本会按依赖顺序启动全部后端服务和前端开发服务器，输出详细分阶段日志，并在启动完成后自动打开前端页面（`http://localhost:5173`）。

### 启动（Linux/macOS）

```bash
chmod +x ./scripts/start-all.sh
./scripts/start-all.sh
```

脚本会输出详细启动日志、服务检查结果与本地访问 URL；若系统支持 `xdg-open` 或 `open`，会自动打开前端页面。

## 常用访问地址

- Frontend: `http://localhost:5173`
- Eureka: `http://localhost:8761`
- Config Server 健康检查: `http://localhost:8888/actuator/health`
- Gateway 入口: `http://localhost:9000`
