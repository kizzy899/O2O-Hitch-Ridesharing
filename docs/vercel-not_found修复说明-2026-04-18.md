# Vercel `NOT_FOUND` 修复说明（2026-04-18）

## 1. 问题背景
- 线上访问 Vercel 部署地址时，直接打开或刷新前端子路由（如 `/passenger/home`、`/driver/orders`）出现 `NOT_FOUND`。
- 参考文档：<https://vercel.com/docs/errors/not_found>

## 2. 现象与触发条件
- 项目使用 `react-router-dom` 的 `BrowserRouter`（History 路由）。
- 在浏览器地址栏直接输入子路由，或在子路由页面刷新时，Vercel 会先按“静态文件路径”查找资源。
- 若没有将该路径重写到 `index.html`，平台会返回 `NOT_FOUND`。

## 3. 根因分析
- 仓库内存在前端重写配置文件 `frontend/vercel.json`，但该文件被 `.gitignore` 忽略，导致 Git 集成部署时可能未携带此配置。
- 缺失 rewrite 后，Vercel 无法把 SPA 子路由回退到入口页，触发 `NOT_FOUND`。

## 4. 本次修复内容
1. 取消忽略 `frontend/vercel.json`，确保配置可被版本管理并随部署生效。
2. 明确 SPA rewrite 规则：除 `/api/**` 外，其他路径回退到 `/index.html`。

## 5. 变更文件
- `.gitignore`
  - 删除 `/frontend/vercel.json` 忽略规则。
- `frontend/vercel.json`
  - rewrite 规则调整为：
    - `source`: `/:path((?!api/).*)`
    - `destination`: `/index.html`

## 6. 验证结果
- 本地执行前端构建通过：
  - `npm --prefix frontend run build`
- `frontend/vercel.json` JSON 语法校验通过。

## 7. 部署侧检查项（必做）
1. 确认 Vercel Project 的 **Root Directory** 指向 `frontend`（若该项目仅部署前端）。
2. 部署后验证：
   - 访问根路径可打开页面；
   - 直接访问 `/auth`、`/passenger/home`、`/driver/orders` 不再返回 `NOT_FOUND`；
   - `/api/**` 路径不应被前端 rewrite 吞掉。

## 8. 经验总结
- SPA + `BrowserRouter` 在静态托管场景下，必须配置 fallback rewrite。
- 路由关键配置文件不要被 `.gitignore` 忽略，否则容易出现“本地正常、线上 404/NOT_FOUND”。
