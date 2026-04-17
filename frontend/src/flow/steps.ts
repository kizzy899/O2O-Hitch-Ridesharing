import type { FlowTokens, StepDefinition, StepState } from "../types";

export const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 1,
    title: "登录（乘客）",
    roleView: "passenger",
    objective: "用乘客账号登录获取 passenger token。",
    rationale: "后续乘客侧行程与订单接口都依赖鉴权令牌。",
    requestExample: "POST /auth/login { username: passenger001, password: 123456 }",
    successCriteria: "响应中存在 token 且可用于 Bearer 鉴权。",
    commonError: "用户名密码错误或网关未启动。",
    requires: []
  },
  {
    id: 2,
    title: "发起行程",
    roleView: "passenger",
    objective: "创建一条乘客行程并记录 tripId。",
    rationale: "订单创建依赖 tripId 且需匹配乘客归属。",
    requestExample: "POST /trips { passengerId, from, to }",
    successCriteria: "返回 tripId 且 status 为 PUBLISHED。",
    commonError: "Authorization 缺失或 passengerId 与 token 不一致。",
    requires: ["passengerToken"]
  },
  {
    id: 3,
    title: "查询我的行程",
    roleView: "passenger",
    objective: "按乘客维度查询行程列表。",
    rationale: "验证行程写入与查询闭环。",
    requestExample: "GET /trips?passengerId=passenger001",
    successCriteria: "列表中包含刚创建的 tripId。",
    commonError: "token 失效或传错 passengerId。",
    requires: ["passengerToken", "tripId"]
  },
  {
    id: 4,
    title: "创建订单",
    roleView: "passenger",
    objective: "基于 tripId 创建订单并记录 orderId。",
    rationale: "进入司机接单环节的关键起点。",
    requestExample: "POST /orders/create { tripId, driverId, passengerId }",
    successCriteria: "返回 orderId 且 status 为 PENDING_ACCEPT。",
    commonError: "tripId 无效或司机不可接单。",
    requires: ["passengerToken", "tripId"]
  },
  {
    id: 5,
    title: "登录（司机）",
    roleView: "driver",
    objective: "用司机账号登录获取 driver token。",
    rationale: "接单/完单属于司机侧受控动作。",
    requestExample: "POST /auth/login { username: driver001, password: 123456 }",
    successCriteria: "响应中存在 driver token。",
    commonError: "司机账号不存在或密码错误。",
    requires: []
  },
  {
    id: 6,
    title: "司机接单",
    roleView: "driver",
    objective: "司机接受目标订单。",
    rationale: "触发行程状态推进和司机可接单状态联动。",
    requestExample: "POST /orders/{orderId}/accept",
    successCriteria: "status=ACCEPTED, tripStatus=ORDER_ACCEPTED, driverAvailable=false。",
    commonError: "orderId 错误或非归属司机操作。",
    requires: ["driverToken", "orderId"]
  },
  {
    id: 7,
    title: "完成或取消订单",
    roleView: "mixed",
    objective: "执行完成（7A）或取消（7B）分支。",
    rationale: "验证订单状态分支与行程联动完整性。",
    requestExample: "POST /orders/{orderId}/complete 或 /cancel",
    successCriteria: "完成分支返回 COMPLETED；取消分支返回 CANCELLED。",
    commonError: "角色权限不符或状态流转不合法。",
    requires: ["orderId"]
  },
  {
    id: 8,
    title: "查询订单详情",
    roleView: "passenger",
    objective: "查询单个订单详情。",
    rationale: "验证订单状态最终落库。",
    requestExample: "GET /orders/{orderId}",
    successCriteria: "返回目标 orderId 且状态与分支一致。",
    commonError: "token 角色不匹配或 orderId 不存在。",
    requires: ["passengerToken", "orderId"]
  },
  {
    id: 9,
    title: "查询我的订单列表",
    roleView: "passenger",
    objective: "按 userId 查询订单列表。",
    rationale: "验证列表接口作用域和状态过滤。",
    requestExample: "GET /orders?userId=passenger001&status=...",
    successCriteria: "列表返回当前乘客数据。",
    commonError: "userId 与 token 主体不一致。",
    requires: ["passengerToken"]
  },
  {
    id: 10,
    title: "越权拦截：订单列表",
    roleView: "passenger",
    objective: "乘客尝试查询他人订单列表。",
    rationale: "验证用户作用域拦截生效。",
    requestExample: "GET /orders?userId=passenger002",
    successCriteria: "接口返回权限错误并被拦截。",
    commonError: "若返回成功则说明授权策略异常。",
    requires: ["passengerToken"],
    securityStep: true
  },
  {
    id: 11,
    title: "越权拦截：非归属司机接单",
    roleView: "driver",
    objective: "使用 other-driver-token 尝试接单。",
    rationale: "验证司机归属校验。",
    requestExample: "POST /orders/{orderId}/accept (other driver)",
    successCriteria: "返回订单作用域错误。",
    commonError: "测试账号缺失会导致前置登录失败。",
    requires: ["orderId"],
    securityStep: true
  },
  {
    id: 12,
    title: "越权拦截：行程详情",
    roleView: "passenger",
    objective: "查询他人 tripId 的详情。",
    rationale: "验证乘客不能访问他人行程。",
    requestExample: "GET /trips/{foreignTripId}",
    successCriteria: "返回行程作用域错误。",
    commonError: "未提供 foreignTripId 无法执行。",
    requires: ["passengerToken", "foreignTripId"],
    securityStep: true
  },
  {
    id: 13,
    title: "越权拦截：司机绑定",
    roleView: "driver",
    objective: "司机使用非本人 driverId 尝试绑定行程。",
    rationale: "验证司机绑定作用域校验。",
    requestExample: "POST /trips/{tripId}/match-driver?driverId=driver002",
    successCriteria: "返回行程绑定作用域错误。",
    commonError: "tripId 不存在会掩盖越权结果。",
    requires: ["driverToken", "tripId"],
    securityStep: true
  }
];

const REQUIREMENT_LABELS: Record<string, string> = {
  passengerToken: "乘客 token",
  driverToken: "司机 token",
  tripId: "tripId",
  orderId: "orderId",
  foreignTripId: "他人 tripId"
};

export function isStepBlocked(step: StepDefinition, tokens: FlowTokens): string | null {
  const missing = step.requires.filter((key) => !tokens[key]);
  if (missing.length === 0) {
    return null;
  }

  return `缺少前置条件：${missing.map((key) => REQUIREMENT_LABELS[key]).join("、")}`;
}

export function getStepStatusLabel(status: StepState): string {
  switch (status) {
    case "running":
      return "执行中";
    case "passed":
      return "已通过";
    case "failed":
      return "失败";
    default:
      return "待执行";
  }
}

export function isSecurityStep(stepId: number): boolean {
  return stepId >= 10;
}
