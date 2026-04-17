export type StepState = "idle" | "running" | "passed" | "failed";

export type RoleView = "passenger" | "driver" | "admin" | "mixed";

export interface StepDefinition {
  id: number;
  title: string;
  roleView: RoleView;
  objective: string;
  rationale: string;
  requestExample: string;
  successCriteria: string;
  commonError: string;
  requires: Array<"passengerToken" | "driverToken" | "tripId" | "orderId" | "foreignTripId">;
  securityStep?: boolean;
}

export interface FlowTokens {
  passengerToken: string;
  driverToken: string;
  tripId: string;
  orderId: string;
  foreignTripId: string;
}

export interface FlowContext extends FlowTokens {
  roleView: RoleView;
  activeStepId: number;
  completionAction: "complete" | "cancel";
  stepStates: Record<number, StepState>;
  stepMessages: Record<number, string>;
  lastResponse: unknown;
  lastError: string;
}

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
  traceId?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  role: string;
}

export interface TripRecord {
  tripId?: string;
  id?: string;
  passengerId: string;
  status?: string;
  driverId?: string;
}

export interface OrderRecord {
  orderId?: string;
  id?: string;
  tripId: string;
  passengerId: string;
  driverId: string;
  status?: string;
  tripStatus?: string;
  driverAvailable?: boolean;
}

export interface FlowStepResult {
  passed: boolean;
  summary: string;
  data?: unknown;
}
