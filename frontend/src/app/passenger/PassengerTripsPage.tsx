import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import type { TripRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

function tripStatusLabel(status?: string) {
  switch (status) {
    case "PUBLISHED": return "已发布";
    case "MATCHED": return "已匹配";
    case "ORDER_ACCEPTED": return "已接单";
    case "ORDER_COMPLETED": return "已完成";
    case "ORDER_CANCELLED": return "已取消";
    default: return status || "未知";
  }
}

function canCreateOrder(status?: string) {
  return status === "PUBLISHED" || status === "MATCHED";
}

export function PassengerTripsPage() {
  const { state, setTripId, setOrderId, setActiveStep, setStepState } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.passengerToken), [makeApi, state.tokens.passengerToken]);
  const navigate = useNavigate();

  const [items, setItems] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingOrderForTrip, setCreatingOrderForTrip] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadTrips() {
    const passengerId = state.users.passenger?.userId;
    if (!passengerId) {
      setError("请先登录乘客账号");
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const list = await api.listTrips(passengerId);
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder(trip: TripRecord) {
    const tripId = trip.tripId || trip.id || "";
    const passengerId = state.users.passenger?.userId;
    if (!passengerId || !tripId) return;

    setCreatingOrderForTrip(tripId);
    setError("");
    setSuccessMsg("");

    try {
      const order = await api.createOrder({
        tripId,
        driverId: "driver001",
        passengerId
      });
      const orderId = order.orderId || order.id || "";
      setTripId(tripId);
      setOrderId(orderId);
      setStepState(5, "passed", "订单创建成功", order);
      setActiveStep(6);
      setSuccessMsg(`订单创建成功！订单号: ${orderId}`);
      await loadTrips();
      setTimeout(() => navigate("/passenger/orders"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "创建订单失败");
    } finally {
      setCreatingOrderForTrip("");
    }
  }

  useEffect(() => {
    void loadTrips();
  }, [state.users.passenger?.userId, state.tokens.passengerToken]);

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>我的行程</h2>
        <div className="page-actions">
          <PageBackButton fallback="/passenger/home" />
          <button type="button" onClick={loadTrips} disabled={loading}>{loading ? "加载中..." : "刷新列表"}</button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {successMsg ? <p className="success-note">{successMsg}</p> : null}

      {!loading && !items.length ? <p className="empty-state">暂无行程，去发布一个吧。</p> : null}

      <div className="list-stack">
        {items.map((item) => {
          const id = item.tripId || item.id || "";
          const isCreating = creatingOrderForTrip === id;
          return (
            <article key={id} className="trip-card">
              <div className="trip-info">
                <div className="trip-header">
                  <h3 className="trip-id">{id}</h3>
                  <span className={`status-tag status-${(item.status || "unknown").toLowerCase().replace("_", "-")}`}>
                    {tripStatusLabel(item.status)}
                  </span>
                </div>
                <div className="trip-route">
                  <span className="route-point">
                    <span className="point-label">起点</span>
                    <span className="point-value">{item.from || "未设置"}</span>
                  </span>
                  <span className="route-arrow">→</span>
                  <span className="route-point">
                    <span className="point-label">终点</span>
                    <span className="point-value">{item.to || "未设置"}</span>
                  </span>
                </div>
                {item.driverId && (
                  <p className="trip-driver">司机: {item.driverId}</p>
                )}
              </div>
              <div className="trip-actions">
                {canCreateOrder(item.status) && (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => handleCreateOrder(item)}
                    disabled={loading || !!creatingOrderForTrip}
                  >
                    {isCreating ? "下单中..." : "立即下单"}
                  </button>
                )}
                <button type="button" onClick={() => setTripId(id)} disabled={loading}>
                  设为当前
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
