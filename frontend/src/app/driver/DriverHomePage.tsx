import { Link } from "react-router-dom";
import { useAppSession } from "../../state/app-session";
import { PageBackButton } from "../components/PageBackButton";

export function DriverHomePage() {
  const { state } = useAppSession();

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>司机首页</h2>
        <PageBackButton fallback="/auth" />
      </div>
      <p>欢迎你，{state.users.driver?.userId ?? "司机"}。</p>
      <div className="card-grid">
        <article className="biz-card">
          <h3>可接行程</h3>
          <p>按待接单订单展示可接任务。</p>
          <Link to="/driver/available">查看可接</Link>
        </article>
        <article className="biz-card">
          <h3>我的订单</h3>
          <p>查看当前司机相关订单和状态流转。</p>
          <Link to="/driver/orders">查看订单</Link>
        </article>
      </div>
    </section>
  );
}
