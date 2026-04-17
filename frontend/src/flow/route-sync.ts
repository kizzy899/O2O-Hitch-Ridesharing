const STEP_ROUTE_MAP: Record<number, string> = {
  1: "/auth",
  2: "/passenger/home",
  3: "/passenger/trips/new",
  4: "/passenger/trips",
  5: "/passenger/home",
  6: "/auth",
  7: "/driver/home",
  8: "/driver/available",
  9: "/driver/orders",
  10: "/passenger/orders",
  11: "/passenger/orders",
  12: "/passenger/orders",
  13: "/driver/available",
  14: "/passenger/trips",
  15: "/driver/available"
};

const AUTH_STEPS = new Set([1, 2, 6, 7]);
const PASSENGER_ORDER_STEPS = new Set([10, 11, 12]);
const PASSENGER_TRIPS_STEPS = new Set([4, 14]);
const DRIVER_AVAILABLE_STEPS = new Set([8, 13, 15]);

export function getRouteForStep(stepId: number): string {
  return STEP_ROUTE_MAP[stepId] ?? "/auth";
}

export function getStepForRoute(pathname: string, currentStepId: number): number {
  if (/^\/auth$/.test(pathname)) {
    return AUTH_STEPS.has(currentStepId) ? currentStepId : 1;
  }

  if (/^\/passenger\/trips\/new$/.test(pathname)) return 3;
  if (/^\/passenger\/trips$/.test(pathname)) return PASSENGER_TRIPS_STEPS.has(currentStepId) ? currentStepId : 4;
  if (/^\/passenger\/orders$/.test(pathname)) return PASSENGER_ORDER_STEPS.has(currentStepId) ? currentStepId : 11;
  if (/^\/passenger\/home$/.test(pathname)) return 2;
  if (/^\/driver\/available$/.test(pathname)) return DRIVER_AVAILABLE_STEPS.has(currentStepId) ? currentStepId : 8;
  if (/^\/driver\/orders$/.test(pathname)) return 9;
  if (/^\/driver\/home$/.test(pathname)) return 7;

  return currentStepId;
}
