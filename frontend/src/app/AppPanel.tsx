import { Outlet } from "react-router-dom";

export function AppPanel() {
  return (
    <section className="app-panel">
      <Outlet />
    </section>
  );
}

