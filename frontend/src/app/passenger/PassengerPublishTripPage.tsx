import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

const POPULAR_LOCATIONS = [
  "Campus A",
  "Campus B",
  "火车站",
  "机场",
  "市中心",
  "商业区",
  "住宅区",
  "科技园"
];

export function PassengerPublishTripPage() {
  const { state, setActiveStep, setStepState, setTripId } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.passengerToken), [makeApi, state.tokens.passengerToken]);
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!from.trim() || !to.trim()) {
      setError("请填写起点和终点");
      return;
    }

    if (from.trim() === to.trim()) {
      setError("起点和终点不能相同");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const passengerId = state.users.passenger?.userId;
      if (!passengerId) {
        throw new ApiError("请先登录乘客账号", 401);
      }
      await api.upsertPassengerProfile(passengerId);
      const trip = await api.createTrip({
        passengerId,
        from: from.trim(),
        to: to.trim()
      });
      const tripId = trip.tripId || trip.id || "";
      setTripId(tripId);
      setStepState(3, "passed", "行程发布成功", trip);
      setActiveStep(4);
      setMessage(`行程发布成功！正在跳转...`);
      setTimeout(() => navigate("/passenger/trips"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "发布失败");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickSelect(location: string, type: "from" | "to") {
    if (type === "from") {
      setFrom(location);
    } else {
      setTo(location);
    }
  }

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>发布行程</h2>
        <PageBackButton fallback="/passenger/home" />
      </div>

      <div className="publish-trip-container">
        <form className="trip-form" onSubmit={onSubmit}>
          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">📍</span>
              起点
            </label>
            <input
              className="form-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="请输入起点位置"
              required
            />
            <div className="quick-select">
              {POPULAR_LOCATIONS.filter(loc => loc !== to).slice(0, 4).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`quick-btn ${from === loc ? "active" : ""}`}
                  onClick={() => handleQuickSelect(loc, "from")}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="route-divider">
            <span className="divider-arrow">↓</span>
          </div>

          <div className="form-section">
            <label className="form-label">
              <span className="label-icon">🎯</span>
              终点
            </label>
            <input
              className="form-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="请输入终点位置"
              required
            />
            <div className="quick-select">
              {POPULAR_LOCATIONS.filter(loc => loc !== from).slice(0, 4).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`quick-btn ${to === loc ? "active" : ""}`}
                  onClick={() => handleQuickSelect(loc, "to")}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {from && to && from !== to && (
            <div className="route-preview">
              <div className="preview-title">行程预览</div>
              <div className="preview-route">
                <span className="preview-point">{from}</span>
                <span className="preview-arrow">→</span>
                <span className="preview-point">{to}</span>
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {message && <p className="success-note">{message}</p>}

          <button
            type="submit"
            className="primary submit-btn"
            disabled={loading || !from.trim() || !to.trim()}
          >
            {loading ? "发布中..." : "发布行程"}
          </button>
        </form>
      </div>
    </section>
  );
}
