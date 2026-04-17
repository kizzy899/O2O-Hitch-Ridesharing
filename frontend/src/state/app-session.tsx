import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { ApiTrace, ApiTraceSource, AppRole, AppSessionState, AppUser, FlowStepResult, StepState } from "../types";
import { STEP_DEFINITIONS } from "../flow/steps";

function buildInitialStepStates(): Record<number, StepState> {
  return STEP_DEFINITIONS.reduce<Record<number, StepState>>((acc, step) => {
    acc[step.id] = "idle";
    return acc;
  }, {});
}

const initialState: AppSessionState = {
  tokens: {
    passengerToken: "",
    driverToken: ""
  },
  users: {},
  activeRole: "guest",
  flow: {
    roleView: "mixed",
    activeStepId: 1,
    completionAction: "complete",
    tripId: "",
    orderId: "",
    foreignTripId: "",
    stepStates: buildInitialStepStates(),
    stepMessages: {},
    lastResponse: null,
    lastError: ""
  },
  apiTrace: null
};

type AppSessionAction =
  | { type: "SET_ACTIVE_ROLE"; role: AppRole }
  | { type: "LOGOUT_ACTIVE_ROLE" }
  | { type: "SET_ROLE_VIEW"; roleView: AppSessionState["flow"]["roleView"] }
  | { type: "SET_ACTIVE_STEP"; stepId: number }
  | { type: "SET_COMPLETION_ACTION"; action: "complete" | "cancel" }
  | { type: "SET_FOREIGN_TRIP_ID"; foreignTripId: string }
  | { type: "SET_TRIP_ID"; tripId: string }
  | { type: "SET_ORDER_ID"; orderId: string }
  | { type: "LOGIN_SUCCESS"; role: Exclude<AppRole, "guest">; token: string; user: AppUser }
  | { type: "SET_STEP_STATE"; stepId: number; state: StepState; message?: string; payload?: unknown; error?: string }
  | { type: "SET_LAST_RESPONSE"; payload: unknown; error?: string }
  | { type: "TRACE"; trace: ApiTrace }
  | { type: "RESET_FLOW_STATUS" };

function reducer(state: AppSessionState, action: AppSessionAction): AppSessionState {
  switch (action.type) {
    case "SET_ACTIVE_ROLE":
      return { ...state, activeRole: action.role };
    case "LOGOUT_ACTIVE_ROLE": {
      if (state.activeRole === "passenger") {
        return {
          ...state,
          activeRole: state.tokens.driverToken ? "driver" : "guest",
          tokens: { ...state.tokens, passengerToken: "" },
          users: { ...state.users, passenger: undefined }
        };
      }

      if (state.activeRole === "driver") {
        return {
          ...state,
          activeRole: state.tokens.passengerToken ? "passenger" : "guest",
          tokens: { ...state.tokens, driverToken: "" },
          users: { ...state.users, driver: undefined }
        };
      }

      return state;
    }
    case "SET_ROLE_VIEW":
      return { ...state, flow: { ...state.flow, roleView: action.roleView } };
    case "SET_ACTIVE_STEP":
      return { ...state, flow: { ...state.flow, activeStepId: action.stepId } };
    case "SET_COMPLETION_ACTION":
      return { ...state, flow: { ...state.flow, completionAction: action.action } };
    case "SET_FOREIGN_TRIP_ID":
      return { ...state, flow: { ...state.flow, foreignTripId: action.foreignTripId } };
    case "SET_TRIP_ID":
      return { ...state, flow: { ...state.flow, tripId: action.tripId } };
    case "SET_ORDER_ID":
      return { ...state, flow: { ...state.flow, orderId: action.orderId } };
    case "LOGIN_SUCCESS": {
      const userKey = action.role;
      const tokenKey = `${action.role}Token` as "passengerToken" | "driverToken";
      return {
        ...state,
        activeRole: action.role,
        users: {
          ...state.users,
          [userKey]: action.user
        },
        tokens: {
          ...state.tokens,
          [tokenKey]: action.token
        }
      };
    }
    case "SET_STEP_STATE":
      return {
        ...state,
        flow: {
          ...state.flow,
          stepStates: { ...state.flow.stepStates, [action.stepId]: action.state },
          stepMessages: action.message ? { ...state.flow.stepMessages, [action.stepId]: action.message } : state.flow.stepMessages,
          lastResponse: action.payload ?? state.flow.lastResponse,
          lastError: action.error ?? ""
        }
      };
    case "SET_LAST_RESPONSE":
      return {
        ...state,
        flow: {
          ...state.flow,
          lastResponse: action.payload,
          lastError: action.error ?? ""
        }
      };
    case "TRACE":
      return {
        ...state,
        apiTrace: action.trace
      };
    case "RESET_FLOW_STATUS":
      return {
        ...state,
        flow: {
          ...state.flow,
          stepStates: buildInitialStepStates(),
          stepMessages: {},
          activeStepId: 1,
          lastResponse: null,
          lastError: ""
        }
      };
    default:
      return state;
  }
}

interface AppSessionContextValue {
  state: AppSessionState;
  setActiveRole: (role: AppRole) => void;
  logoutActiveRole: () => void;
  setRoleView: (roleView: AppSessionState["flow"]["roleView"]) => void;
  setActiveStep: (stepId: number) => void;
  setCompletionAction: (action: "complete" | "cancel") => void;
  setForeignTripId: (foreignTripId: string) => void;
  setTripId: (tripId: string) => void;
  setOrderId: (orderId: string) => void;
  setStepState: (stepId: number, state: StepState, message?: string, payload?: unknown, error?: string) => void;
  setLastResponse: (payload: unknown, error?: string) => void;
  loginSuccess: (role: Exclude<AppRole, "guest">, token: string, user: AppUser) => void;
  recordTrace: (source: ApiTraceSource, trace: Omit<ApiTrace, "source" | "timestamp">) => void;
}

const AppSessionContext = createContext<AppSessionContextValue | undefined>(undefined);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      state,
      setActiveRole: (role) => dispatch({ type: "SET_ACTIVE_ROLE", role }),
      logoutActiveRole: () => dispatch({ type: "LOGOUT_ACTIVE_ROLE" }),
      setRoleView: (roleView) => dispatch({ type: "SET_ROLE_VIEW", roleView }),
      setActiveStep: (stepId) => dispatch({ type: "SET_ACTIVE_STEP", stepId }),
      setCompletionAction: (action) => dispatch({ type: "SET_COMPLETION_ACTION", action }),
      setForeignTripId: (foreignTripId) => dispatch({ type: "SET_FOREIGN_TRIP_ID", foreignTripId }),
      setTripId: (tripId) => dispatch({ type: "SET_TRIP_ID", tripId }),
      setOrderId: (orderId) => dispatch({ type: "SET_ORDER_ID", orderId }),
      setStepState: (stepId, stepState, message, payload, error) =>
        dispatch({ type: "SET_STEP_STATE", stepId, state: stepState, message, payload, error }),
      setLastResponse: (payload, error) => dispatch({ type: "SET_LAST_RESPONSE", payload, error }),
      loginSuccess: (role, token, user) => dispatch({ type: "LOGIN_SUCCESS", role, token, user }),
      recordTrace: (source, trace) =>
        dispatch({
          type: "TRACE",
          trace: {
            ...trace,
            source,
            timestamp: Date.now()
          }
        })
    }),
    [state]
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return context;
}

export function normalizeAuth(data: unknown): { token: string; userId: string; role: string } {
  if (Array.isArray(data)) {
    return data[0] as { token: string; userId: string; role: string };
  }
  return data as { token: string; userId: string; role: string };
}

export function toFlowTokens(state: AppSessionState) {
  return {
    passengerToken: state.tokens.passengerToken,
    driverToken: state.tokens.driverToken,
    tripId: state.flow.tripId,
    orderId: state.flow.orderId,
    foreignTripId: state.flow.foreignTripId
  };
}

export function makeFlowStepResult(passed: boolean, summary: string, data?: unknown): FlowStepResult {
  return { passed, summary, data };
}

