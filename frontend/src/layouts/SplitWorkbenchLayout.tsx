import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getRouteSyncAction } from "../flow/route-sync";
import { useAppSession } from "../state/app-session";

const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? "false") === "true";

export function SplitWorkbenchLayout() {
  const { state, logoutActiveRole, setActiveRole, setActiveStep } = useAppSession();
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);
  const prevStepIdRef = useRef(state.flow.activeStepId);

  const currentUser =
    state.activeRole === "passenger"
      ? state.users.passenger
      : state.activeRole === "driver"
        ? state.users.driver
        : undefined;

  const roleLabel =
    state.activeRole === "passenger" ? "乘客" : state.activeRole === "driver" ? "司机" : "未登录";

  function handleSessionAction() {
    if (state.activeRole === "guest") {
      navigate("/auth");
      return;
    }

    logoutActiveRole();
    setActiveRole("guest");
    navigate("/auth");
  }

  useEffect(() => {
    if (!DEMO_MODE) {
      return;
    }

    const action = getRouteSyncAction({
      pathname: location.pathname,
      activeStepId: state.flow.activeStepId,
      prevPathname: prevPathnameRef.current,
      prevStepId: prevStepIdRef.current
    });

    if (action?.type === "set-step") {
      setActiveStep(action.stepId);
    }
    if (action?.type === "navigate") {
      navigate(action.path);
    }

    prevPathnameRef.current = location.pathname;
    prevStepIdRef.current = state.flow.activeStepId;
  }, [location.pathname, navigate, setActiveStep, state.flow.activeStepId]);

  return (
    <div className={`workbench-root ${DEMO_MODE ? "demo-mode" : "app-mode"}`}>
      <header className="workbench-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <span />
          </div>
          <div className="brand-copy">
            <span className="brand-kicker">同路出行服务</span>
            <h1>顺路出行</h1>
            <p>发布行程、匹配车主、在线履约，全流程清晰可追踪。</p>
          </div>
        </div>

        <nav className="header-nav">
          <NavLink to="/auth">首页</NavLink>
          <NavLink to="/passenger/home">乘客中心</NavLink>
          <NavLink to="/driver/home">司机中心</NavLink>
        </nav>

        <div className="header-meta">
          <div className="identity-chip">
            <span className="identity-label">当前身份</span>
            <strong>{roleLabel}</strong>
          </div>
          <div className="identity-chip">
            <span className="identity-label">账号</span>
            <strong>{currentUser?.userId ?? "未登录"}</strong>
          </div>
          <button
            type="button"
            className={state.activeRole === "guest" ? "primary header-action" : "header-action"}
            onClick={handleSessionAction}
          >
            {state.activeRole === "guest" ? "立即登录" : "退出"}
          </button>
        </div>
      </header>

      <main className="single-body">
        <Outlet />
      </main>
    </div>
  );
}
