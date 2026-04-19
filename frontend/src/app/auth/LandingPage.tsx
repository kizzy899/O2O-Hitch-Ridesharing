import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import { normalizeAuth, useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";

export function LandingPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [identity, setIdentity] = useState<"passenger" | "driver">("passenger");
  const [username, setUsername] = useState("passenger001");
  const [password, setPassword] = useState("123456");
  const [registerRole, setRegisterRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [registerUsername, setRegisterUsername] = useState("passenger002");
  const [registerPassword, setRegisterPassword] = useState("123456");
  const [registerNickname, setRegisterNickname] = useState("passenger-002");
  const [registerMobile, setRegisterMobile] = useState("13800001021");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const { loginSuccess, setActiveStep, setStepState } = useAppSession();
  const { makeApi } = useApiFactory("webapp");
  const api = useMemo(() => makeApi(() => ""), [makeApi]);
  const navigate = useNavigate();

  function onIdentityChange(role: "passenger" | "driver") {
    setIdentity(role);
    setUsername(role === "passenger" ? "passenger001" : "driver001");
    setPassword("123456");
    setError("");
  }

  function switchToLogin(role: "passenger" | "driver") {
    setAuthMode("login");
    onIdentityChange(role);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = normalizeAuth(await api.login(username.trim(), password));
      const role = session.role.toUpperCase() === "DRIVER" ? "driver" : "passenger";
      loginSuccess(role, session.token, { userId: session.userId, role: session.role });
      if (role === "driver") {
        setStepState(7, "passed", "司机登录成功", session);
        setActiveStep(8);
      } else {
        setStepState(2, "passed", "乘客登录成功", session);
        setActiveStep(3);
      }
      navigate(role === "driver" ? "/driver/home" : "/passenger/home");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistering(true);
    setRegisterError("");
    try {
      const session = normalizeAuth(
        await api.register(
          registerUsername.trim(),
          registerPassword,
          registerRole,
          registerNickname.trim(),
          registerMobile.trim()
        )
      );
      const role = session.role.toUpperCase() === "DRIVER" ? "driver" : "passenger";
      loginSuccess(role, session.token, { userId: session.userId, role: session.role });
      if (role === "driver") {
        setStepState(6, "passed", "司机注册成功", session);
        setActiveStep(7);
      } else {
        setStepState(1, "passed", "乘客注册成功", session);
        setActiveStep(2);
      }
      navigate(role === "driver" ? "/driver/home" : "/passenger/home");
    } catch (err) {
      if (err instanceof ApiError) {
        setRegisterError(err.message);
      } else {
        setRegisterError(err instanceof Error ? err.message : "注册失败，请稍后重试");
      }
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="landing-wrap">
      <div className="landing-shell">
        <section className="landing-showcase">
          <span className="landing-badge">城际顺风车服务</span>
          <div className="landing-head">
            <h2>顺路的人，更快相遇</h2>
            <p>从发布行程到订单履约，乘客与司机都能在同一套体验里完成匹配、确认和状态追踪。</p>
          </div>

          <div className="landing-metrics">
            <article className="metric-card">
              <strong>实时匹配</strong>
              <span>发布后快速进入可接列表，减少等待沟通成本。</span>
            </article>
            <article className="metric-card">
              <strong>状态同步</strong>
              <span>订单接受、完成、取消等关键状态双端同步可见。</span>
            </article>
            <article className="metric-card">
              <strong>信息透明</strong>
              <span>起终点、司机、订单进度都在一个页面内清晰呈现。</span>
            </article>
          </div>

          <div className="landing-actions">
            <button type="button" className="primary" onClick={() => switchToLogin("passenger")}>
              乘客立即出发
            </button>
            <button type="button" onClick={() => switchToLogin("driver")}>
              司机开始接单
            </button>
          </div>

          <div className="landing-trust">
            <span>通勤顺路</span>
            <span>跨区出行</span>
            <span>返程拼车</span>
            <span>全程状态可追踪</span>
          </div>
        </section>

        <section className="landing-card auth-surface">
          <div className="auth-surface-head">
            <span className="auth-kicker">账户服务</span>
            <h3>{authMode === "login" ? "登录账号" : "创建账号"}</h3>
            <p>{authMode === "login" ? "选择身份后即可进入对应工作台。" : "填写基础信息，注册后自动进入服务页面。"}</p>
          </div>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              注册
            </button>
          </div>

          {authMode === "login" ? (
            <>
              <div className="identity-switch">
                <button
                  type="button"
                  className={identity === "passenger" ? "active" : ""}
                  onClick={() => onIdentityChange("passenger")}
                >
                  乘客登录
                </button>
                <button
                  type="button"
                  className={identity === "driver" ? "active" : ""}
                  onClick={() => onIdentityChange("driver")}
                >
                  司机登录
                </button>
              </div>

              <form className="auth-form auth-form-product" onSubmit={handleSubmit}>
                <label>
                  用户名
                  <input value={username} onChange={(e) => setUsername(e.target.value)} required />
                </label>
                <label>
                  密码
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>

                {error ? <p className="form-error">{error}</p> : null}

                <button type="submit" className="primary" disabled={loading}>
                  {loading ? "登录中..." : "进入服务"}
                </button>
              </form>

              <p className="auth-footnote">系统会根据账号角色自动进入乘客端或司机端。</p>
            </>
          ) : (
            <form className="auth-form auth-form-product" onSubmit={handleRegister}>
              <label>
                注册身份
                <div className="identity-switch compact">
                  <button
                    type="button"
                    className={registerRole === "PASSENGER" ? "active" : ""}
                    onClick={() => setRegisterRole("PASSENGER")}
                  >
                    乘客
                  </button>
                  <button
                    type="button"
                    className={registerRole === "DRIVER" ? "active" : ""}
                    onClick={() => setRegisterRole("DRIVER")}
                  >
                    司机
                  </button>
                </div>
              </label>
              <label>
                用户名
                <input value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required />
              </label>
              <label>
                昵称
                <input value={registerNickname} onChange={(e) => setRegisterNickname(e.target.value)} required />
              </label>
              <label>
                手机号
                <input value={registerMobile} onChange={(e) => setRegisterMobile(e.target.value)} required />
              </label>
              <label>
                密码
                <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
              </label>
              {registerError ? <p className="form-error">{registerError}</p> : null}
              <button type="submit" className="primary" disabled={registering}>
                {registering ? "注册中..." : "注册并进入"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

