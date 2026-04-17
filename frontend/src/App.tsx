import { useMemo, useState } from "react";
import { ApiError, API_BASE_URL, createApi } from "./api";
import { GuideBox } from "./components/GuideBox";
import { ResponsePanel } from "./components/ResponsePanel";
import { RoleDrawer } from "./components/RoleDrawer";
import { Timeline } from "./components/Timeline";
import { STEP_DEFINITIONS, isStepBlocked, isSecurityStep } from "./flow/steps";
import type { FlowContext, FlowStepResult, RoleView, StepState } from "./types";

const PASSENGER_ID = "passenger001";
const DRIVER_ID = "driver001";

function buildInitialStepStates(): Record<number, StepState> {
  return STEP_DEFINITIONS.reduce<Record<number, StepState>>((acc, step) => {
    acc[step.id] = "idle";
    return acc;
  }, {});
}

const initialContext: FlowContext = {
  roleView: "mixed",
  activeStepId: 1,
  completionAction: "complete",
  passengerToken: "",
  driverToken: "",
  tripId: "",
  orderId: "",
  foreignTripId: "",
  stepStates: buildInitialStepStates(),
  stepMessages: {},
  lastResponse: null,
  lastError: ""
};

export default function App() {
  const [context, setContext] = useState<FlowContext>(initialContext);
  const [activeToken, setActiveToken] = useState<string>("");

  const api = useMemo(() => createApi(() => activeToken), [activeToken]);
  const activeStep = STEP_DEFINITIONS.find((step) => step.id === context.activeStepId) ?? STEP_DEFINITIONS[0];

  const passedCount = Object.values(context.stepStates).filter((state) => state === "passed").length;

  function setStepState(stepId: number, state: StepState, message?: string, payload?: unknown, error?: string) {
    setContext((prev) => ({
      ...prev,
      stepStates: { ...prev.stepStates, [stepId]: state },
      stepMessages: message ? { ...prev.stepMessages, [stepId]: message } : prev.stepMessages,
      lastResponse: payload ?? prev.lastResponse,
      lastError: error ?? ""
    }));
  }

  function normalizeAuth(data: unknown): { token: string; userId: string; role: string } {
    if (Array.isArray(data)) {
      return data[0] as { token: string; userId: string; role: string };
    }
    return data as { token: string; userId: string; role: string };
  }

  async function runCurrentStep() {
    const blocked = isStepBlocked(activeStep, context);
    if (blocked) {
      setStepState(activeStep.id, "failed", blocked, context.lastResponse, blocked);
      return;
    }

    setStepState(activeStep.id, "running", "正在执行...");

    try {
      const result = await executeStep(activeStep.id);
      setStepState(activeStep.id, result.passed ? "passed" : "failed", result.summary, result.data, result.passed ? "" : result.summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setStepState(activeStep.id, "failed", message, null, message);
    }
  }

  async function executeStep(stepId: number): Promise<FlowStepResult> {
    const runApi = createApi(() => activeToken);

    if (stepId === 1) {
      setActiveToken("");
      const session = normalizeAuth(await runApi.login(PASSENGER_ID, "123456"));
      setContext((prev) => ({ ...prev, passengerToken: session.token }));
      return { passed: true, summary: "乘客登录成功，已保存 passenger token。", data: session };
    }

    if (stepId === 2) {
      setActiveToken(context.passengerToken);
      const trip = await runApi.createTrip({ passengerId: PASSENGER_ID, from: "Campus A", to: "Campus B" });
      const tripId = trip.tripId || trip.id || "";
      setContext((prev) => ({ ...prev, tripId }));
      return { passed: Boolean(tripId), summary: tripId ? `行程创建成功：${tripId}` : "未返回 tripId", data: trip };
    }

    if (stepId === 3) {
      setActiveToken(context.passengerToken);
      const trips = await runApi.listTrips(PASSENGER_ID);
      const hit = trips.some((item) => (item.tripId || item.id) === context.tripId);
      return { passed: hit, summary: hit ? "行程列表已包含当前 tripId。" : "列表未命中当前 tripId。", data: trips };
    }

    if (stepId === 4) {
      setActiveToken(context.passengerToken);
      const order = await runApi.createOrder({ tripId: context.tripId, driverId: DRIVER_ID, passengerId: PASSENGER_ID });
      const orderId = order.orderId || order.id || "";
      setContext((prev) => ({ ...prev, orderId }));
      return { passed: Boolean(orderId), summary: orderId ? `订单创建成功：${orderId}` : "未返回 orderId", data: order };
    }

    if (stepId === 5) {
      setActiveToken("");
      const session = normalizeAuth(await runApi.login(DRIVER_ID, "123456"));
      setContext((prev) => ({ ...prev, driverToken: session.token }));
      return { passed: true, summary: "司机登录成功，已保存 driver token。", data: session };
    }

    if (stepId === 6) {
      setActiveToken(context.driverToken);
      const order = await runApi.acceptOrder(context.orderId);
      const passed = order.status === "ACCEPTED" && order.tripStatus === "ORDER_ACCEPTED" && order.driverAvailable === false;
      return {
        passed,
        summary: passed ? "接单联动校验通过。" : "接单成功但关键字段不符合预期。",
        data: order
      };
    }

    if (stepId === 7) {
      if (context.completionAction === "complete") {
        setActiveToken(context.driverToken);
        const order = await runApi.completeOrder(context.orderId);
        const passed = order.status === "COMPLETED" && order.tripStatus === "ORDER_COMPLETED";
        return { passed, summary: passed ? "完成分支通过。" : "完成分支字段不符合预期。", data: order };
      }

      setActiveToken(context.passengerToken);
      const order = await runApi.cancelOrder(context.orderId);
      const passed = order.status === "CANCELLED" && order.tripStatus === "ORDER_CANCELLED";
      return { passed, summary: passed ? "取消分支通过。" : "取消分支字段不符合预期。", data: order };
    }

    if (stepId === 8) {
      setActiveToken(context.passengerToken);
      const order = await runApi.getOrder(context.orderId);
      const expectedStatus = context.completionAction === "complete" ? "COMPLETED" : "CANCELLED";
      const passed = order.status === expectedStatus;
      return { passed, summary: passed ? "订单详情状态正确。" : `订单状态不是 ${expectedStatus}。`, data: order };
    }

    if (stepId === 9) {
      setActiveToken(context.passengerToken);
      const status = context.completionAction === "complete" ? "ACCEPTED" : "CANCELLED";
      const orders = await runApi.listOrders(PASSENGER_ID, status);
      return { passed: Array.isArray(orders), summary: "订单列表查询成功。", data: orders };
    }

    if (stepId === 10) {
      return runSecurityStep(async () => {
        setActiveToken(context.passengerToken);
        return runApi.listOrders("passenger002");
      }, "越权订单列表已被拦截。");
    }

    if (stepId === 11) {
      return runSecurityStep(async () => {
        setActiveToken("");
        const other = normalizeAuth(await runApi.login("driver002", "123456"));
        setActiveToken(other.token);
        return runApi.acceptOrder(context.orderId);
      }, "非归属司机接单已被拦截。", "driver002 账号不可用，无法完成该项越权验证。请确认测试账号。", true);
    }

    if (stepId === 12) {
      return runSecurityStep(async () => {
        setActiveToken(context.passengerToken);
        return runApi.getTrip(context.foreignTripId);
      }, "他人行程详情访问已被拦截。");
    }

    return runSecurityStep(async () => {
      setActiveToken(context.driverToken);
      return runApi.matchDriver(context.tripId, "driver002");
    }, "司机越权绑定已被拦截。");
  }

  async function runSecurityStep(
    action: () => Promise<unknown>,
    successSummary: string,
    setupFailSummary?: string,
    treatSetupFailAsFailed = false
  ): Promise<FlowStepResult> {
    try {
      const data = await action();
      return { passed: false, summary: "请求意外成功，越权校验失败。", data };
    } catch (error) {
      if (error instanceof ApiError) {
        return { passed: true, summary: `${successSummary}（${error.message}）`, data: error.payload };
      }
      if (setupFailSummary && treatSetupFailAsFailed) {
        return { passed: false, summary: setupFailSummary };
      }
      const message = error instanceof Error ? error.message : "未知错误";
      return { passed: true, summary: `${successSummary}（${message}）` };
    }
  }

  const blockedReason = isStepBlocked(activeStep, context);
  const roleFilteredSteps = context.roleView === "mixed"
    ? STEP_DEFINITIONS
    : STEP_DEFINITIONS.filter((step) => step.roleView === context.roleView || step.roleView === "mixed");

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>O2O Hitch 全流程演示台</h1>
          <p>API: {API_BASE_URL}</p>
        </div>
        <div className="progress">通过进度 {passedCount} / {STEP_DEFINITIONS.length}</div>
      </header>

      <RoleDrawer roleView={context.roleView} onChange={(roleView: RoleView) => setContext((prev) => ({ ...prev, roleView }))} />

      <main className="content-grid">
        <aside>
          <Timeline
            steps={roleFilteredSteps}
            activeStepId={context.activeStepId}
            stepStates={context.stepStates}
            onSelect={(activeStepId) => setContext((prev) => ({ ...prev, activeStepId }))}
            getBlockedReason={(step) => isStepBlocked(step, context)}
          />
        </aside>

        <section className="main-panel">
          {isSecurityStep(activeStep.id) ? <p className="security-banner">安全验证专区（步骤10-13）</p> : null}
          <GuideBox
            step={activeStep}
            state={context.stepStates[activeStep.id]}
            blockedReason={blockedReason}
            message={context.stepMessages[activeStep.id] ?? ""}
            onRun={runCurrentStep}
            onPrev={() => setContext((prev) => ({ ...prev, activeStepId: Math.max(1, prev.activeStepId - 1) }))}
            onNext={() => setContext((prev) => ({ ...prev, activeStepId: Math.min(13, prev.activeStepId + 1) }))}
            canPrev={context.activeStepId > 1}
            canNext={context.activeStepId < 13}
            completionAction={context.completionAction}
            onCompletionActionChange={(completionAction) => setContext((prev) => ({ ...prev, completionAction }))}
            foreignTripId={context.foreignTripId}
            onForeignTripIdChange={(foreignTripId) => setContext((prev) => ({ ...prev, foreignTripId }))}
          />
          <ResponsePanel lastResponse={context.lastResponse} lastError={context.lastError} />
        </section>
      </main>

      <footer className="status-bar">
        <span>passengerToken: {context.passengerToken ? "已获取" : "未获取"}</span>
        <span>driverToken: {context.driverToken ? "已获取" : "未获取"}</span>
        <span>tripId: {context.tripId || "-"}</span>
        <span>orderId: {context.orderId || "-"}</span>
      </footer>
    </div>
  );
}
