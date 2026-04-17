import { describe, expect, it } from "vitest";
import { STEP_DEFINITIONS, getStepStatusLabel, isStepBlocked } from "../flow/steps";

describe("flow steps", () => {
  it("should provide all 13 demo steps", () => {
    expect(STEP_DEFINITIONS).toHaveLength(13);
  });

  it("should block step 2 when passenger token is missing", () => {
    const blocked = isStepBlocked(STEP_DEFINITIONS[1], {
      passengerToken: "",
      driverToken: "",
      tripId: "",
      orderId: "",
      foreignTripId: ""
    });
    expect(blocked).toContain("token");
  });

  it("should allow step 6 after order id and driver token are present", () => {
    const blocked = isStepBlocked(STEP_DEFINITIONS[5], {
      passengerToken: "p",
      driverToken: "d",
      tripId: "t",
      orderId: "o",
      foreignTripId: ""
    });
    expect(blocked).toBeNull();
  });

  it("should expose labels for all step states", () => {
    expect(getStepStatusLabel("idle")).toBe("待执行");
    expect(getStepStatusLabel("running")).toBe("执行中");
    expect(getStepStatusLabel("passed")).toBe("已通过");
    expect(getStepStatusLabel("failed")).toBe("失败");
  });
});
