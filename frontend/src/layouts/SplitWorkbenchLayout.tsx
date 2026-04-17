import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FlowConsolePanel } from "../console/FlowConsolePanel";
import { getRouteSyncAction } from "../flow/route-sync";
import { useAppSession } from "../state/app-session";

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

  function handleLogout() {
    logoutActiveRole();
    setActiveRole("guest");
    navigate("/auth");
  }

  useEffect(() => {
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
    <div className="workbench-root">
      <header className="workbench-header">
        <div>
          <h1>Hitch Ride Platform</h1>
          <p>教学控制台 + 真实业务界面</p>
        </div>

        <nav className="header-nav">
          <NavLink to="/auth">认证入口</NavLink>
          <NavLink to="/passenger/home">乘客端</NavLink>
          <NavLink to="/driver/home">司机端</NavLink>
        </nav>

        <div className="header-meta">
          <span className="identity-tag">身份: {state.activeRole === "guest" ? "未登录" : state.activeRole}</span>
          <span className="identity-user">用户: {currentUser?.userId ?? "-"}</span>
          <button type="button" onClick={handleLogout} disabled={state.activeRole === "guest"}>退出登录</button>
        </div>
      </header>

      <div className="split-body">
        <aside className="split-left">
          <FlowConsolePanel />
        </aside>
        <main className="split-right">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
