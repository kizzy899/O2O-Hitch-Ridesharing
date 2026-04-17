import { Link } from "react-router-dom";
import { useAppSession } from "../../state/app-session";
import { PageBackButton } from "../components/PageBackButton";

export function PassengerHomePage() {
  const { state } = useAppSession();

  return (
    <section className="role-page">
      <div className="page-head">
        <h2>乘客首页</h2>
        <PageBackButton fallback="/auth" />
      </div>
      <p>欢迎你，{state.users.passenger?.userId ?? "乘客"}。</p>
      <div className="card-grid">
        <article className="biz-card">
          <h3>发布行程</h3>
          <p>快速创建你的出行需求。</p>
          <Link to="/passenger/trips/new">去发布</Link>
        </article>
        <article className="biz-card">
          <h3>我的行程</h3>
          <p>查看已发布与已匹配行程状态。</p>
          <Link to="/passenger/trips">查看行程</Link>
        </article>
        <article className="biz-card">
          <h3>我的订单</h3>
          <p>追踪订单状态、司机信息和进度。</p>
          <Link to="/passenger/orders">查看订单</Link>
        </article>
      </div>
    </section>
  );
}
