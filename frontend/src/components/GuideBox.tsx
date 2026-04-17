import { getStepStatusLabel } from "../flow/steps";
import type { StepDefinition, StepState } from "../types";

interface GuideBoxProps {
  step: StepDefinition;
  state: StepState;
  blockedReason: string | null;
  message: string;
  onRun: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  completionAction: "complete" | "cancel";
  onCompletionActionChange: (value: "complete" | "cancel") => void;
  foreignTripId: string;
  onForeignTripIdChange: (value: string) => void;
}

export function GuideBox({
  step,
  state,
  blockedReason,
  message,
  onRun,
  onPrev,
  onNext,
  canPrev,
  canNext,
  completionAction,
  onCompletionActionChange,
  foreignTripId,
  onForeignTripIdChange
}: GuideBoxProps) {
  return (
    <section className={`guide-box state-${state}`}>
      <header className="guide-header">
        <h2>步骤 {step.id} · {step.title}</h2>
        <span className="status-pill">{getStepStatusLabel(state)}</span>
      </header>

      <div className="guide-grid">
        <article>
          <h3>做什么</h3>
          <p>{step.objective}</p>
        </article>
        <article>
          <h3>为什么</h3>
          <p>{step.rationale}</p>
        </article>
        <article>
          <h3>请求示例</h3>
          <code>{step.requestExample}</code>
        </article>
        <article>
          <h3>成功判定</h3>
          <p>{step.successCriteria}</p>
        </article>
        <article>
          <h3>常见错误</h3>
          <p>{step.commonError}</p>
        </article>
      </div>

      {step.id === 7 ? (
        <div className="inline-controls">
          <label>
            <input
              type="radio"
              name="completionAction"
              checked={completionAction === "complete"}
              onChange={() => onCompletionActionChange("complete")}
            />
            7A 司机完成
          </label>
          <label>
            <input
              type="radio"
              name="completionAction"
              checked={completionAction === "cancel"}
              onChange={() => onCompletionActionChange("cancel")}
            />
            7B 乘客取消
          </label>
        </div>
      ) : null}

      {step.id === 12 ? (
        <div className="inline-controls">
          <label htmlFor="foreignTripId">他人 tripId（用于越权测试）</label>
          <input
            id="foreignTripId"
            value={foreignTripId}
            onChange={(event) => onForeignTripIdChange(event.target.value)}
            placeholder="例如：trip-of-passenger002"
          />
        </div>
      ) : null}

      <p className="guide-message">{blockedReason || message || "执行后这里会显示关键提示。"}</p>

      <div className="guide-actions">
        <button type="button" onClick={onPrev} disabled={!canPrev}>上一步</button>
        <button type="button" className="primary" onClick={onRun} disabled={Boolean(blockedReason) || state === "running"}>
          {state === "running" ? "执行中..." : "执行当前步骤"}
        </button>
        <button type="button" onClick={onNext} disabled={!canNext}>下一步</button>
      </div>
    </section>
  );
}
