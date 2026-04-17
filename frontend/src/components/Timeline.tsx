import { getStepStatusLabel } from "../flow/steps";
import type { StepDefinition, StepState } from "../types";

interface TimelineProps {
  steps: StepDefinition[];
  activeStepId: number;
  stepStates: Record<number, StepState>;
  onSelect: (stepId: number) => void;
  getBlockedReason: (step: StepDefinition) => string | null;
}

export function Timeline({ steps, activeStepId, stepStates, onSelect, getBlockedReason }: TimelineProps) {
  return (
    <ol className="timeline">
      {steps.map((step) => {
        const status = stepStates[step.id] ?? "idle";
        const blockedReason = getBlockedReason(step);
        const className = [
          "timeline-item",
          step.id === activeStepId ? "active" : "",
          `state-${status}`,
          blockedReason ? "blocked" : ""
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={step.id} className={className}>
            <button type="button" onClick={() => onSelect(step.id)}>
              <span className="step-index">步骤 {step.id}</span>
              <strong>{step.title}</strong>
              <span className="step-status">{getStepStatusLabel(status)}</span>
            </button>
            {blockedReason ? <p className="blocked-note">{blockedReason}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
