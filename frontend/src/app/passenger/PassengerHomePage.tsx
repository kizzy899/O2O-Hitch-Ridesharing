import { Link } from "react-router-dom";
import { useAppSession } from "../../state/app-session";
import { PageBackButton } from "../components/PageBackButton";

export function PassengerHomePage() {
  const { state } = useAppSession();
  const passengerId = state.users.passenger?.userId ?? "乘客";

  return (
    <section className="role-page">
      <div className="page-hero">
        <div className="page-title-block">
          <span className="page-overline">Passenger Center</span>
          <div className="page-head">
            <h2>你好，{passengerId}</h2>
            <PageBackButton fallback="/auth" />
          </div>
          <p className="page-sub">从发布行程到查看订单，所有出行状态都集中在这里，流程更清楚，操作更顺手。</p>
        </div>

        <div className="page-metrics compact">
          <article className="page-metric">
            <strong>发布需求</strong>
            <span>快速填写起终点，立即进入匹配流程。</span>
          </article>
          <article className="page-metric">
            <strong>追踪进度</strong>
            <span>实时查看行程与订单状态变化。</span>
          </article>
        </div>
      </div>

      <div className="card-grid">
        <article className="biz-card">
          <span className="card-kicker">Trip Creation</span>
          <h3>发布新的出行需求</h3>
          <p>输入起点和终点后即可创建行程，系统会进入后续匹配和下单流程。</p>
          <Link to="/passenger/trips/new">立即发布</Link>
        </article>
        <article className="biz-card">
          <span className="card-kicker">Trip Status</span>
          <h3>查看我的行程</h3>
          <p>浏览已发布、已匹配和已完成的行程记录，掌握当前出行状态。</p>
          <Link to="/passenger/trips">进入行程列表</Link>
        </article>
        <article className="biz-card">
          <span className="card-kicker">Order Tracking</span>
          <h3>管理我的订单</h3>
          <p>查看司机信息、订单状态和履约进度，必要时也可以直接取消订单。</p>
          <Link to="/passenger/orders">查看订单详情</Link>
        </article>
      </div>
    </section>
  );
}
