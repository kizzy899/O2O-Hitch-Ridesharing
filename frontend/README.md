# O2O Hitch Frontend

基于 `Vite + React + TypeScript` 的全流程演示前端。

## 功能概览
- 单入口流程台：按时间轴覆盖演示手册 1-13 步。
- 指引框：每步固定展示做什么/为什么/请求示例/成功判定/常见错误。
- 角色抽屉：乘客、司机、管理员、全流程视图切换。
- 安全验证专区：步骤 10-13 越权拦截可视化。
- 底部运行状态栏：token、tripId、orderId 实时显示。

## 本地运行
```bash
npm install
npm run dev
```

默认网关地址来自 `.env`：
- `VITE_API_BASE_URL=http://localhost:9000/api`

## 测试与构建
```bash
npm test
npm run build
```
