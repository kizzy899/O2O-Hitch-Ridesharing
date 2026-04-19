import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api";
import type { OrderRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

function orderStatusLabel(status?: string) {
  switch (status) {
    case "PENDING_ACCEPT": return "等待接单";
    case "ACCEPTED": return "已接单";
    case "COMPLETED": return "已完成";
    case "CANCELLED": return "已取消";
    default: return status || "未知";
  }
}

function tripStatusLabel(status?: string) {
  switch (status) {
    case "PUBLISHED": return "已发布";
    case "MATCHED": return "已匹配";
    case "ORDER_ACCEPTED": return "进行中";
    case "ORDER_COMPLETED": return "行程完成";
    case "ORDER_CANCELLED": return "行程取消";
    default: return status || "-";
  }
}

export function DriverOrdersPage() {
  const { state, setLastResponse, setActiveStep, setStepState } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.driverToken), [makeApi, state.tokens.driverToken]);

  const [items, setItems] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  async function loadOrders() {
    const driverId = state.users.driver?.userId;
    if (!driverId) {
      setError("请先登录司机账号");
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const list = await api.listOrders(driverId);
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, [state.users.driver?.userId, state.tokens.driverToken]);

  async function completeOrder(orderId: string) {
    setProcessingOrderId(orderId);
    setError("");
    setSuccessMsg("");
    try {
      const response = await api.completeOrder(orderId);
      setLastResponse(response);
      setStepState(9, "passed", "订单已完成", response);
      setActiveStep(10);
      setSuccessMsg("订单已完成！");
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "完成失败");
    } finally {
      setProcessingOrderId("");
    }
  }

  async function cancelOrder(orderId: string) {
    setProcessingOrderId(orderId);
    setError("");
    setSuccessMsg("");
    try {
      const response = await api.cancelOrder(orderId);
      setLastResponse(response);
      setStepState(9, "passed", "订单已取消", response);
      setActiveStep(10);
      setSuccessMsg("订单已取消");
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "取消失败");
    } finally {
      setProcessingOrderId("");
    }
  }

  async function viewDetail(orderId: string) {
    setProcessingOrderId(orderId);
    setError("");
    try {
      const response = await api.getOrder(orderId);
      setLastResponse(response);
      setSelectedOrder(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "读取失败");
    } finally {
      setProcessingOrderId("");
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
      {successMsg ? <p className="success-note">{successMsg}</p> : null}
      {!loading && !items.length ? <p className="empty-state">暂无订单记录。</p> : null}

      {selectedOrder && (
        <div className="order-detail-modal">
          <div className="order-detail-content">
            <div className="detail-header">
              <h3>订单详情</h3>
              <button type="button" onClick={() => setSelectedOrder(null)}>关闭</button>
            </div>
            <div className="detail-body">
              <div className="detail-row">
                <span className="detail-label">订单号</span>
                <span className="detail-value">{selectedOrder.orderId || selectedOrder.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">行程号</span>
                <span className="detail-value">{selectedOrder.tripId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">乘客</span>
                <span className="detail-value">{selectedOrder.passengerId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">订单状态</span>
                <span className={`status-tag status-${(selectedOrder.status || "unknown").toLowerCase().replace("_", "-")}`}>
                  {orderStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">行程状态</span>
                <span className="detail-value">{tripStatusLabel(selectedOrder.tripStatus)}</span>
              </div>
              {selectedOrder.driverNode && (
                <div className="detail-row">
                  <span className="detail-label">服务节点</span>
                  <span className="detail-value">{selectedOrder.driverNode}</span>
                </div>
              )}
              {selectedOrder.driverAvailable !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">可接单状态</span>
                  <span className="detail-value">{selectedOrder.driverAvailable ? "是" : "否"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="list-stack">
        {items.map((item) => {
          const id = item.orderId || item.id || "";
          const isProcessing = processingOrderId === id;
          const canComplete = item.status === "ACCEPTED";
          const canCancel = item.status === "PENDING_ACCEPT" || item.status === "ACCEPTED";

          return (
            <article className="order-card" key={id}>
              <div className="order-info">
                <div className="order-header">
                  <h3 className="order-id">{id}</h3>
                  <span className={`status-tag status-${(item.status || "unknown").toLowerCase().replace("_", "-")}`}>
                    {orderStatusLabel(item.status)}
                  </span>
                </div>
                <div className="order-details">
                  <span className="order-detail-item">
                    <span className="detail-icon">👤</span>
                    <span>乘客: {item.passengerId}</span>
                  </span>
                  <span className="order-detail-item">
                    <span className="detail-icon">📋</span>
                    <span>行程: {item.tripId}</span>
                  </span>
                  {item.tripStatus && (
                    <span className="order-detail-item">
                      <span className="detail-icon">📍</span>
                      <span>行程状态: {tripStatusLabel(item.tripStatus)}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="order-actions">
                <button
                  type="button"
                  onClick={() => viewDetail(id)}
                  disabled={loading || !!processingOrderId}
                >
                  {isProcessing ? "加载中..." : "查看详情"}
                </button>
                {canComplete && (
                  <button
                    type="button"
                    className="success"
                    onClick={() => completeOrder(id)}
                    disabled={loading || !!processingOrderId}
                  >
                    {isProcessing ? "处理中..." : "完成订单"}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => cancelOrder(id)}
                    disabled={loading || !!processingOrderId}
                  >
                    {isProcessing ? "处理中..." : "取消订单"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
