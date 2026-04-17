import { useMemo, useState } from "react";
import { ApiError } from "../../api";
import type { OrderRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

export function PassengerOrdersPage() {
  const { state, setOrderId, setLastResponse } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.passengerToken), [makeApi, state.tokens.passengerToken]);

  const [items, setItems] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listOrders(state.users.passenger?.userId ?? "passenger001");
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    try {
      const response = await api.cancelOrder(orderId);
      setLastResponse(response);
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "取消失败");
    }
  }

  async function readDetail(orderId: string) {
    try {
      const response = await api.getOrder(orderId);
      setOrderId(orderId);
      setLastResponse(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "读取失败");
    }
  }

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>我的订单</h2>
        <div className="page-actions">
          <PageBackButton fallback="/passenger/home" />
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
                <p>司机: {item.driverId}</p>
              </div>
              <span className={`status-tag status-${(item.status || "unknown").toLowerCase()}`}>{item.status || "未知"}</span>
              <div className="inline-actions">
                <button type="button" onClick={() => readDetail(id)}>详情</button>
                {(item.status === "PENDING_ACCEPT" || item.status === "ACCEPTED") ? (
                  <button type="button" onClick={() => cancelOrder(id)}>取消</button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
