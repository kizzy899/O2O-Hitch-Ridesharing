import { Link } from "react-router-dom";
import { useAppSession } from "../../state/app-session";
import { PageBackButton } from "../components/PageBackButton";

export function DriverHomePage() {
  const { state } = useAppSession();
  const driverId = state.users.driver?.userId ?? "司机";

  return (
    <section className="role-page">
      <div className="page-hero">
        <div className="page-title-block">
          <span className="page-overline">Driver Center</span>
          <div className="page-head">
            <h2>欢迎回来，{driverId}</h2>
            <PageBackButton fallback="/auth" />
          </div>
          <p className="page-sub">集中处理可接订单、查看履约状态，把接单与完成流程放在同一套操作路径里。</p>
        </div>

        <div className="page-metrics compact">
          <article className="page-metric">
            <strong>即时接单</strong>
            <span>查看待接订单或发布中的行程，快速开始服务。</span>
          </article>
          <article className="page-metric">
            <strong>订单管理</strong>
            <span>支持查看详情、完成订单和取消订单。</span>
          </article>
        </div>
      </div>

      <div className="card-grid">
        <article className="biz-card">
          <span className="card-kicker">Dispatch Board</span>
          <h3>查看当前可接任务</h3>
          <p>在待接订单和发布中行程之间切换，选择更适合当前路线的服务任务。</p>
          <Link to="/driver/available">进入接单大厅</Link>
        </article>
        <article className="biz-card">
          <span className="card-kicker">Order Workspace</span>
          <h3>管理我的订单</h3>
          <p>查看乘客、行程和履约节点，统一处理完成、取消等后续动作。</p>
          <Link to="/driver/orders">进入订单工作台</Link>
        </article>
      </div>
    </section>
  );
}
