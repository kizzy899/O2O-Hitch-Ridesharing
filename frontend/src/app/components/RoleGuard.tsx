import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AppRole } from "../../types";
import { useAppSession } from "../../state/app-session";

interface RoleGuardProps {
  allowedRole: Exclude<AppRole, "guest">;
}

export function RoleGuard({ allowedRole }: RoleGuardProps) {
  const { state } = useAppSession();
  const location = useLocation();

  if (state.activeRole === "guest") {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (state.activeRole !== allowedRole) {
    return <Navigate to={state.activeRole === "passenger" ? "/passenger/home" : "/driver/home"} replace />;
  }

  return <Outlet />;
}
