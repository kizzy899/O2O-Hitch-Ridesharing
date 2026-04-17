import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import { normalizeAuth, useAppSession } from "../../state/app-session";
import { useApiFactory } from "../../state/api-factory";

export function LandingPage() {
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
      <div className="landing-card">
        <div className="landing-head">
          <h2>欢迎进入顺风车平台</h2>
          <p>请选择身份并登录，右侧将进入真实业务页面。</p>
        </div>

        <div className="identity-switch">
          <button type="button" className={identity === "passenger" ? "active" : ""} onClick={() => onIdentityChange("passenger")}>乘客</button>
          <button type="button" className={identity === "driver" ? "active" : ""} onClick={() => onIdentityChange("driver")}>司机</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="signup-shell">
          <h3>注册新账号</h3>
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              注册身份
              <div className="identity-switch">
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
              {registering ? "注册中..." : "注册并登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

