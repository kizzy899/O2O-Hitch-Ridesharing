import { useMemo, useState } from "react";
import { ApiError } from "../../api";
import type { OrderRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

export function DriverOrdersPage() {
  const { state, setLastResponse } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.driverToken), [makeApi, state.tokens.driverToken]);

  const [items, setItems] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listOrders(state.users.driver?.userId ?? "driver001");
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  async function complete(orderId: string) {
    try {
      const response = await api.completeOrder(orderId);
      setLastResponse(response);
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "完成失败");
    }
  }

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>我的订单</h2>
        <div className="page-actions">
          <PageBackButton fallback="/driver/home" />
          <button type="button" onClick={loadOrders} disabled={loading}>{loading ? "加载中..." : "刷新列表"}</button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!items.length ? <p className="empty-state">暂无订单记录。</p> : null}

      <div className="list-stack">
        {items.map((item) => {
          const id = item.orderId || item.id || "";
          return (
            <article className="list-card" key={id}>
              <div>
                <h3>{id}</h3>
                <p>乘客: {item.passengerId}</p>
              </div>
              <span className={`status-tag status-${(item.status || "unknown").toLowerCase()}`}>{item.status || "未知"}</span>
              {item.status === "ACCEPTED" ? (
                <button type="button" onClick={() => complete(id)}>完成</button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
