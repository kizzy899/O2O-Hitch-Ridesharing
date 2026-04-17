import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import { useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";
import { PageBackButton } from "../components/PageBackButton";

export function PassengerPublishTripPage() {
  const { state, setActiveStep, setStepState, setTripId } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => state.tokens.passengerToken), [makeApi, state.tokens.passengerToken]);
  const navigate = useNavigate();

  const [from, setFrom] = useState("Campus A");
  const [to, setTo] = useState("Campus B");
  const [departAt, setDepartAt] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const trip = await api.createTrip({
        passengerId: state.users.passenger?.userId ?? "passenger001",
        from,
        to
      });
      const tripId = trip.tripId || trip.id || "";
      setTripId(tripId);
      setStepState(3, "passed", "行程发布成功", trip);
      setActiveStep(4);
      setMessage(`发布成功，tripId: ${tripId}${departAt ? `，出发时间: ${departAt}` : ""}`);
      navigate("/passenger/trips");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "发布失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>发布行程</h2>
        <PageBackButton fallback="/passenger/home" />
      </div>
      <form className="form-card" onSubmit={onSubmit}>
        <label>
          起点
          <input value={from} onChange={(e) => setFrom(e.target.value)} required />
        </label>
        <label>
          终点
          <input value={to} onChange={(e) => setTo(e.target.value)} required />
        </label>
        <label>
          出发时间
          <input type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
        </label>
        <button type="submit" className="primary" disabled={loading}>{loading ? "提交中..." : "提交"}</button>
      </form>
      {message ? <p className="success-note">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
