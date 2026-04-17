import { describe, expect, it } from "vitest";
import { STEP_DEFINITIONS, getStepStatusLabel, isStepBlocked } from "../flow/steps";

describe("flow steps", () => {
  it("should provide all 15 demo steps", () => {
    expect(STEP_DEFINITIONS).toHaveLength(15);
  });

  it("should insert register steps before passenger and driver login", () => {
    expect(STEP_DEFINITIONS[0].title).toBe("注册（乘客）");
    expect(STEP_DEFINITIONS[1].title).toBe("登录（乘客）");
    expect(STEP_DEFINITIONS[5].title).toBe("注册（司机）");
    expect(STEP_DEFINITIONS[6].title).toBe("登录（司机）");
  });

  it("should block step 3 when passenger token is missing", () => {
    const blocked = isStepBlocked(STEP_DEFINITIONS[2], {
      passengerToken: "",
      driverToken: "",
      tripId: "",
      orderId: "",
      foreignTripId: ""
    });
    expect(blocked).toContain("token");
  });

  it("should allow step 8 after order id and driver token are present", () => {
    const blocked = isStepBlocked(STEP_DEFINITIONS[7], {
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
