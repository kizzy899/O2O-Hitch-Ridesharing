import { useMemo, useRef } from "react";
import { ApiError } from "../api";
import { GuideBox } from "../components/GuideBox";
import { ResponsePanel } from "../components/ResponsePanel";
import { RoleDrawer } from "../components/RoleDrawer";
import { Timeline } from "../components/Timeline";
import { STEP_DEFINITIONS, isSecurityStep, isStepBlocked } from "../flow/steps";
import type { RoleView } from "../types";
import { makeFlowStepResult, normalizeAuth, toFlowTokens, useAppSession } from "../state/app-session";
import { useApiFactory } from "../state/api-factory";

const PASSENGER_ID = "passenger001";
const DRIVER_ID = "driver001";
const DEFAULT_PASSWORD = "123456";

export function FlowConsolePanel() {
  const {
    state,
    setRoleView,
    setActiveStep,
    setCompletionAction,
    setForeignTripId,
    setTripId,
    setOrderId,
    setStepState,
    loginSuccess
  } = useAppSession();

  const { makeApi } = useApiFactory("console");

  const publicApi = useMemo(() => makeApi(() => ""), [makeApi]);
  const passengerApi = useMemo(() => makeApi(() => state.tokens.passengerToken), [makeApi, state.tokens.passengerToken]);
  const driverApi = useMemo(() => makeApi(() => state.tokens.driverToken), [makeApi, state.tokens.driverToken]);
  const registeredPassengerUsernameRef = useRef<string>("");
  const registeredDriverUsernameRef = useRef<string>("");

  const activeStep = STEP_DEFINITIONS.find((step) => step.id === state.flow.activeStepId) ?? STEP_DEFINITIONS[0];
  const blockedReason = isStepBlocked(activeStep, toFlowTokens(state));

  const roleFilteredSteps = state.flow.roleView === "mixed"
    ? STEP_DEFINITIONS
    : STEP_DEFINITIONS.filter((step) => step.roleView === state.flow.roleView || step.roleView === "mixed");

  function buildDynamicUsername(prefix: "passenger" | "driver") {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
    return `${prefix}${suffix}`;
  }

  function buildMobile() {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
    return `138${suffix}`;
  }

  function getPassengerUserId() {
    return state.users.passenger?.userId || registeredPassengerUsernameRef.current || PASSENGER_ID;
  }

  function getDriverLoginUserId() {
    return registeredDriverUsernameRef.current || state.users.driver?.userId || DRIVER_ID;
  }

  async function runCurrentStep() {
    const blocked = isStepBlocked(activeStep, toFlowTokens(state));
    if (blocked) {
      setStepState(activeStep.id, "failed", blocked, state.flow.lastResponse, blocked);
      return;
    }

    setStepState(activeStep.id, "running", "正在执行...");

    try {
      const result = await executeStep(activeStep.id);
      setStepState(activeStep.id, result.passed ? "passed" : "failed", result.summary, result.data, result.passed ? "" : result.summary);
      if (result.passed && activeStep.id < STEP_DEFINITIONS.length) {
        setActiveStep(activeStep.id + 1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setStepState(activeStep.id, "failed", message, null, message);
    }
  }

  async function executeStep(stepId: number) {
    if (stepId === 1) {
      const username = buildDynamicUsername("passenger");
      const session = normalizeAuth(
        await publicApi.register(username, DEFAULT_PASSWORD, "PASSENGER", `乘客${username.slice(-4)}`, buildMobile())
      );
      registeredPassengerUsernameRef.current = username;
      loginSuccess("passenger", session.token, { userId: session.userId, role: session.role });
      return makeFlowStepResult(true, `乘客注册成功，账号 ${session.userId}`, session);
    }

    if (stepId === 2) {
      const session = normalizeAuth(await publicApi.login(getPassengerUserId(), DEFAULT_PASSWORD));
      loginSuccess("passenger", session.token, { userId: session.userId, role: session.role });
      return makeFlowStepResult(true, "乘客登录成功，已同步 passenger token", session);
    }

    if (stepId === 3) {
      const trip = await passengerApi.createTrip({ passengerId: getPassengerUserId(), from: "Campus A", to: "Campus B" });
      const tripId = trip.tripId || trip.id || "";
      setTripId(tripId);
      return makeFlowStepResult(Boolean(tripId), tripId ? `行程创建成功，${tripId}` : "未返回 tripId", trip);
    }

    if (stepId === 4) {
      const trips = await passengerApi.listTrips(getPassengerUserId());
      const hit = trips.some((item) => (item.tripId || item.id) === state.flow.tripId);
      return makeFlowStepResult(hit, hit ? "行程列表已包含当前 tripId" : "列表未命中当前 tripId", trips);
    }

    if (stepId === 5) {
      const order = await passengerApi.createOrder({
        tripId: state.flow.tripId,
        driverId: DRIVER_ID,
        passengerId: getPassengerUserId()
      });
      const orderId = order.orderId || order.id || "";
      setOrderId(orderId);
      return makeFlowStepResult(Boolean(orderId), orderId ? `订单创建成功，${orderId}` : "未返回 orderId", order);
    }

    if (stepId === 6) {
      const username = buildDynamicUsername("driver");
      const session = normalizeAuth(
        await publicApi.register(username, DEFAULT_PASSWORD, "DRIVER", `司机${username.slice(-4)}`, buildMobile())
      );
      registeredDriverUsernameRef.current = username;
      loginSuccess("driver", session.token, { userId: session.userId, role: session.role });
      return makeFlowStepResult(true, `司机注册成功，账号 ${session.userId}`, session);
    }

    if (stepId === 7) {
      const session = normalizeAuth(await publicApi.login(getDriverLoginUserId(), DEFAULT_PASSWORD));
      loginSuccess("driver", session.token, { userId: session.userId, role: session.role });
      return makeFlowStepResult(true, "司机登录成功，已同步 driver token", session);
    }

    if (stepId === 8) {
      try {
        const order = await driverApi.acceptOrder(state.flow.orderId);
        const passed = order.status === "ACCEPTED" && order.tripStatus === "ORDER_ACCEPTED" && order.driverAvailable === false;
        return makeFlowStepResult(passed, passed ? "接单联动校验通过" : "接单成功但关键字段不符合预期", order);
      } catch (error) {
        if (error instanceof ApiError && getDriverLoginUserId() !== DRIVER_ID) {
          const fallbackSession = normalizeAuth(await publicApi.login(DRIVER_ID, DEFAULT_PASSWORD));
          loginSuccess("driver", fallbackSession.token, { userId: fallbackSession.userId, role: fallbackSession.role });
          const fallbackDriverApi = makeApi(() => fallbackSession.token);
          const order = await fallbackDriverApi.acceptOrder(state.flow.orderId);
          const passed = order.status === "ACCEPTED" && order.tripStatus === "ORDER_ACCEPTED" && order.driverAvailable === false;
          return makeFlowStepResult(
            passed,
            passed ? "接单联动校验通过（已回退到演示司机账号）" : "接单成功但关键字段不符合预期",
            order
          );
        }
        throw error;
      }
    }

    if (stepId === 9) {
      if (state.flow.completionAction === "complete") {
        const order = await driverApi.completeOrder(state.flow.orderId);
        const passed = order.status === "COMPLETED" && order.tripStatus === "ORDER_COMPLETED";
        return makeFlowStepResult(passed, passed ? "完成分支通过" : "完成分支字段不符合预期", order);
      }

      const order = await passengerApi.cancelOrder(state.flow.orderId);
      const passed = order.status === "CANCELLED" && order.tripStatus === "ORDER_CANCELLED";
      return makeFlowStepResult(passed, passed ? "取消分支通过" : "取消分支字段不符合预期", order);
    }

    if (stepId === 10) {
      const order = await passengerApi.getOrder(state.flow.orderId);
      const expectedStatus = state.flow.completionAction === "complete" ? "COMPLETED" : "CANCELLED";
      const passed = order.status === expectedStatus;
      return makeFlowStepResult(passed, passed ? "订单详情状态正确" : `订单状态不是 ${expectedStatus}`, order);
    }

    if (stepId === 11) {
      const status = state.flow.completionAction === "complete" ? "ACCEPTED" : "CANCELLED";
      const orders = await passengerApi.listOrders(getPassengerUserId(), status);
      return makeFlowStepResult(Array.isArray(orders), "订单列表查询成功", orders);
    }

    if (stepId === 12) {
      return runSecurityStep(async () => passengerApi.listOrders("passenger002"), "越权订单列表已被拦截");
    }

    if (stepId === 13) {
      return runSecurityStep(
        async () => {
          const session = normalizeAuth(await publicApi.login("driver002", DEFAULT_PASSWORD));
          const otherDriverApi = makeApi(() => session.token);
          return otherDriverApi.acceptOrder(state.flow.orderId);
        },
        "非归属司机接单已被拦截",
        "driver002 账号不可用，无法完成该项越权验证。",
        true
      );
    }

    if (stepId === 14) {
      return runSecurityStep(async () => passengerApi.getTrip(state.flow.foreignTripId), "他人行程详情访问已被拦截");
    }

    return runSecurityStep(async () => driverApi.matchDriver(state.flow.tripId, "driver002"), "司机越权绑定已被拦截");
  }

  async function runSecurityStep(
    action: () => Promise<unknown>,
    successSummary: string,
    setupFailSummary?: string,
    treatSetupFailAsFailed = false
  ) {
    try {
      const data = await action();
      return makeFlowStepResult(false, "请求意外成功，越权校验失败", data);
    } catch (error) {
      if (error instanceof ApiError) {
        return makeFlowStepResult(true, `${successSummary}：${error.message}`, error.payload);
      }
      if (setupFailSummary && treatSetupFailAsFailed) {
        return makeFlowStepResult(false, setupFailSummary);
      }
      const message = error instanceof Error ? error.message : "未知错误";
      return makeFlowStepResult(true, `${successSummary}：${message}`);
    }
  }

  return (
    <section className="console-panel">
      <header className="console-header">
        <h2>流程控制台</h2>
        <p>保留教学演示流程，和右侧产品界面共享状态。</p>
      </header>

      <RoleDrawer roleView={state.flow.roleView} onChange={(roleView: RoleView) => setRoleView(roleView)} />

      <div className="console-scroll">
        <div className="timeline-window">
          <Timeline
            steps={roleFilteredSteps}
            activeStepId={state.flow.activeStepId}
            stepStates={state.flow.stepStates}
            onSelect={(activeStepId) => setActiveStep(activeStepId)}
            getBlockedReason={(step) => isStepBlocked(step, toFlowTokens(state))}
          />
        </div>

        {isSecurityStep(activeStep.id) ? <p className="security-banner">安全验证专区（步骤 12-15）</p> : null}

        <GuideBox
          step={activeStep}
          state={state.flow.stepStates[activeStep.id]}
          blockedReason={blockedReason}
          message={state.flow.stepMessages[activeStep.id] ?? ""}
          onRun={runCurrentStep}
          onPrev={() => setActiveStep(Math.max(1, state.flow.activeStepId - 1))}
          onNext={() => setActiveStep(Math.min(15, state.flow.activeStepId + 1))}
          canPrev={state.flow.activeStepId > 1}
          canNext={state.flow.activeStepId < 15}
          completionAction={state.flow.completionAction}
          onCompletionActionChange={(completionAction) => setCompletionAction(completionAction)}
          foreignTripId={state.flow.foreignTripId}
          onForeignTripIdChange={(foreignTripId) => setForeignTripId(foreignTripId)}
        />

        <ResponsePanel
          lastResponse={state.apiTrace?.responseBody ?? state.flow.lastResponse}
          lastError={state.apiTrace?.errorMessage ?? state.flow.lastError}
        />
      </div>

      <footer className="console-status">
        <span>passengerToken: {state.tokens.passengerToken ? "已获取" : "未获取"}</span>
        <span>driverToken: {state.tokens.driverToken ? "已获取" : "未获取"}</span>
        <span>tripId: {state.flow.tripId || "-"}</span>
        <span>orderId: {state.flow.orderId || "-"}</span>
      </footer>
    </section>
  );
}
