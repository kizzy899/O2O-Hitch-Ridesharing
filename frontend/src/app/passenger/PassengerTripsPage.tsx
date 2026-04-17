import { useMemo, useState } from "react";
import { ApiError } from "../../api";
import type { TripRecord } from "../../types";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

function tripStatusLabel(status?: string) {
  if (status === "MATCHED") return "已匹配";
  if (status === "PUBLISHED") return "已发布";
  return status || "未知";
}

export function PassengerTripsPage() {
  const { state, setTripId } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.passengerToken), [makeApi, state.tokens.passengerToken]);

  const [items, setItems] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTrips() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listTrips(state.users.passenger?.userId ?? "passenger001");
      setItems(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

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

      {!items.length ? <p className="empty-state">暂无行程，去发布一个吧。</p> : null}

      <div className="list-stack">
        {items.map((item) => {
          const id = item.tripId || item.id || "";
          return (
            <article key={id} className="list-card">
              <div>
                <h3>{id}</h3>
                <p>{item.passengerId}</p>
              </div>
              <span className={`status-tag status-${(item.status || "unknown").toLowerCase()}`}>{tripStatusLabel(item.status)}</span>
              <button type="button" onClick={() => setTripId(id)}>设为当前 tripId</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
