import { describe, expect, it } from "vitest";
import { getRouteForStep, getStepForRoute } from "../flow/route-sync";

describe("route and step sync", () => {
  it("maps major steps to right-side pages", () => {
    expect(getRouteForStep(1)).toBe("/auth");
    expect(getRouteForStep(3)).toBe("/passenger/trips/new");
    expect(getRouteForStep(8)).toBe("/driver/available");
    expect(getRouteForStep(11)).toBe("/passenger/orders");
  });

  it("maps right-side pages back to timeline steps", () => {
    expect(getStepForRoute("/passenger/home", 1)).toBe(2);
    expect(getStepForRoute("/passenger/trips/new", 1)).toBe(3);
    expect(getStepForRoute("/driver/home", 1)).toBe(7);
    expect(getStepForRoute("/driver/orders", 1)).toBe(9);
  });

  it("keeps current auth step on auth page", () => {
    expect(getStepForRoute("/auth", 6)).toBe(6);
    expect(getStepForRoute("/auth", 2)).toBe(2);
    expect(getStepForRoute("/auth", 10)).toBe(1);
  });

  it("keeps current step on ambiguous shared pages", () => {
    expect(getStepForRoute("/passenger/orders", 10)).toBe(10);
    expect(getStepForRoute("/passenger/orders", 12)).toBe(12);
    expect(getStepForRoute("/driver/available", 13)).toBe(13);
    expect(getStepForRoute("/passenger/trips", 14)).toBe(14);
  });
});
