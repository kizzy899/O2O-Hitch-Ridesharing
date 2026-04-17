import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FlowConsolePanel } from "../console/FlowConsolePanel";
import { useAppSession } from "../state/app-session";

export function SplitWorkbenchLayout() {
  const { state, logoutActiveRole, setActiveRole } = useAppSession();
  const navigate = useNavigate();

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

