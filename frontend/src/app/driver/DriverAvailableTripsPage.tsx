import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import type { OrderRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

export function DriverAvailableTripsPage() {
  const { state, setActiveStep, setOrderId, setLastResponse, setStepState } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.driverToken), [makeApi, state.tokens.driverToken]);
  const navigate = useNavigate();

  const [items, setItems] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadPendingOrders() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listOrders(state.users.driver?.userId ?? "driver001", "PENDING_ACCEPT");
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  async function accept(orderId: string) {
    try {
      const response = await api.acceptOrder(orderId);
      setOrderId(orderId);
      setLastResponse(response);
      setStepState(8, "passed", "司机接单成功", response);
      setActiveStep(9);
      await loadPendingOrders();
      navigate("/driver/orders");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "接单失败");
    }
  }

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>可接行程</h2>
        <div className="page-actions">
          <PageBackButton fallback="/driver/home" />
          <button type="button" onClick={loadPendingOrders} disabled={loading}>{loading ? "加载中..." : "刷新列表"}</button>
        </div>
      </div>

      <p className="page-sub">数据口径：`PENDING_ACCEPT` 订单即“可接行程”。</p>
      {error ? <p className="form-error">{error}</p> : null}
      {!items.length ? <p className="empty-state">当前没有可接订单。</p> : null}

      <div className="list-stack">
        {items.map((item) => {
          const id = item.orderId || item.id || "";
          return (
            <article className="list-card" key={id}>
              <div>
                <h3>{id}</h3>
                <p>行程: {item.tripId}</p>
              </div>
              <span className="status-tag status-pending_accept">待接单</span>
              <button type="button" className="primary" onClick={() => accept(id)}>接单</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
