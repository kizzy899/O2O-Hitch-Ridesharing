import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import type { OrderRecord, TripRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

type ViewMode = "orders" | "trips";

export function DriverAvailableTripsPage() {
  const { state, setActiveStep, setOrderId, setTripId, setLastResponse, setStepState } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.driverToken), [makeApi, state.tokens.driverToken]);
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("orders");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const driverId = state.users.driver?.userId;

  async function loadPendingOrders() {
    if (!driverId) {
      setError("请先登录司机账号");
      setOrders([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const list = await api.listOrders(driverId, "PENDING_ACCEPT");
      setOrders(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadPublishedTrips() {
    if (!driverId) {
      setError("请先登录司机账号");
      setTrips([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const list = await api.listAllPublishedTrips();
      setTrips(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (viewMode === "orders") {
      void loadPendingOrders();
    } else {
      void loadPublishedTrips();
    }
  }, [driverId, state.tokens.driverToken, viewMode]);

  async function acceptOrder(orderId: string) {
    setProcessingId(orderId);
    setError("");
    setSuccessMsg("");
    try {
      const response = await api.acceptOrder(orderId);
      setOrderId(orderId);
      setLastResponse(response);
      setStepState(8, "passed", "司机接单成功", response);
      setActiveStep(9);
      setSuccessMsg("接单成功！正在跳转到订单页面...");
      await loadPendingOrders();
      setTimeout(() => navigate("/driver/orders"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "接单失败");
    } finally {
      setProcessingId("");
    }
  }

  async function matchAndAcceptTrip(trip: TripRecord) {
    const tripId = trip.tripId || trip.id || "";
    if (!driverId || !tripId) return;

    setProcessingId(tripId);
    setError("");
    setSuccessMsg("");
    try {
      await api.matchDriver(tripId, driverId);
      setTripId(tripId);

      const order = await api.createOrder({
        tripId,
        driverId,
        passengerId: trip.passengerId
      });
      const orderId = order.orderId || order.id || "";
      setOrderId(orderId);

      const acceptedOrder = await api.acceptOrder(orderId);
      setLastResponse(acceptedOrder);
      setStepState(8, "passed", "匹配并接单成功", acceptedOrder);
      setActiveStep(9);
      setSuccessMsg("接单成功！正在跳转到订单页面...");
      setTimeout(() => navigate("/driver/orders"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "处理失败");
    } finally {
      setProcessingId("");
    }
  }

  function handleRefresh() {
    if (viewMode === "orders") {
      loadPendingOrders();
    } else {
      loadPublishedTrips();
    }
  }

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>可接行程</h2>
        <div className="page-actions">
          <PageBackButton fallback="/driver/home" />
          <button type="button" onClick={handleRefresh} disabled={loading}>
            {loading ? "加载中..." : "刷新列表"}
          </button>
        </div>
      </div>

      <div className="view-mode-switch">
        <button
          type="button"
          className={viewMode === "orders" ? "active" : ""}
          onClick={() => setViewMode("orders")}
        >
          待接订单
        </button>
        <button
          type="button"
          className={viewMode === "trips" ? "active" : ""}
          onClick={() => setViewMode("trips")}
        >
          发布中行程
        </button>
      </div>

      <p className="page-sub">
        {viewMode === "orders"
          ? "显示状态为 PENDING_ACCEPT 的订单，点击接单开始服务"
          : "显示状态为 PUBLISHED 的行程，可匹配并接单"}
      </p>

      {error ? <p className="form-error">{error}</p> : null}
      {successMsg ? <p className="success-note">{successMsg}</p> : null}

      {viewMode === "orders" && (
        <>
          {!loading && !orders.length && <p className="empty-state">当前没有待接订单。</p>}
          <div className="list-stack">
            {orders.map((item) => {
              const id = item.orderId || item.id || "";
              const isProcessing = processingId === id;
              return (
                <article className="order-card available" key={id}>
                  <div className="order-info">
                    <div className="order-header">
                      <h3 className="order-id">{id}</h3>
                      <span className="status-tag status-pending-accept">待接单</span>
                    </div>
                    <div className="order-details">
                      <span className="order-detail-item">
                        <span className="detail-icon">📋</span>
                        <span>行程: {item.tripId}</span>
                      </span>
                      <span className="order-detail-item">
                        <span className="detail-icon">👤</span>
                        <span>乘客: {item.passengerId}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="primary accept-btn"
                    onClick={() => acceptOrder(id)}
                    disabled={loading || !!processingId}
                  >
                    {isProcessing ? "接单中..." : "立即接单"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}

      {viewMode === "trips" && (
        <>
          {!loading && !trips.length && <p className="empty-state">当前没有可接行程。</p>}
          <div className="list-stack">
            {trips.map((item) => {
              const id = item.tripId || item.id || "";
              const isProcessing = processingId === id;
              return (
                <article className="trip-card available" key={id}>
                  <div className="trip-info">
                    <div className="trip-header">
                      <h3 className="trip-id">{id}</h3>
                      <span className="status-tag status-published">待匹配</span>
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
                    <p className="trip-passenger">
                      <span className="detail-icon">👤</span>
                      乘客: {item.passengerNickname || item.passengerId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="primary accept-btn"
                    onClick={() => matchAndAcceptTrip(item)}
                    disabled={loading || !!processingId}
                  >
                    {isProcessing ? "处理中..." : "匹配并接单"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
