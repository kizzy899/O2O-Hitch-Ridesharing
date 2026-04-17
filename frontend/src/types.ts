export type StepState = "idle" | "running" | "passed" | "failed";

export type RoleView = "passenger" | "driver" | "admin" | "mixed";
export type AppRole = "passenger" | "driver" | "guest";
export type ApiTraceSource = "console" | "webapp";

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

export interface FlowContext {
  roleView: RoleView;
  activeStepId: number;
  completionAction: "complete" | "cancel";
  tripId: string;
  orderId: string;
  foreignTripId: string;
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

export interface AppUser {
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

export interface ApiTrace {
  source: ApiTraceSource;
  method: string;
  path: string;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
  timestamp: number;
}

export interface AppSessionState {
  tokens: {
    passengerToken: string;
    driverToken: string;
  };
  users: {
    passenger?: AppUser;
    driver?: AppUser;
  };
  activeRole: AppRole;
  flow: FlowContext;
  apiTrace: ApiTrace | null;
}
