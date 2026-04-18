import type { ApiEnvelope, AuthSession, OrderRecord, TripRecord } from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000/api";

export interface ApiClientTraceEvent {
  method: string;
  path: string;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
}

export interface ApiClientHooks {
  onRequest?: (event: ApiClientTraceEvent) => void;
  onResponse?: (event: ApiClientTraceEvent) => void;
  onError?: (event: ApiClientTraceEvent) => void;
}

export class ApiError extends Error {
  status: number;
  traceId?: string;
  payload?: unknown;

  constructor(message: string, status: number, traceId?: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.traceId = traceId;
    this.payload = payload;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: () => string;
  private readonly hooks?: ApiClientHooks;

  constructor(baseUrl: string, tokenProvider: () => string = () => "", hooks?: ApiClientHooks) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.tokenProvider = tokenProvider;
    this.hooks = hooks;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, "GET");
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, "POST", body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, "PUT", body);
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const token = this.tokenProvider();
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    this.hooks?.onRequest?.({ method, path, requestBody: body });

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const envelope = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || envelope.code !== 0) {
      this.hooks?.onError?.({
        method,
        path,
        requestBody: body,
        responseBody: envelope,
        errorMessage: envelope.message || "请求失败"
      });
      throw new ApiError(envelope.message || "请求失败", response.status, envelope.traceId, envelope);
    }

    this.hooks?.onResponse?.({
      method,
      path,
      requestBody: body,
      responseBody: envelope.data
    });

    return envelope.data;
  }
}

export function createApi(tokenProvider: () => string, hooks?: ApiClientHooks): ReturnType<typeof buildApi> {
  const client = new ApiClient(API_BASE_URL, tokenProvider, hooks);
  return buildApi(client);
}

function buildApi(client: ApiClient) {
  return {
    login: (username: string, password: string) => client.post<AuthSession | AuthSession[]>("/auth/login", { username, password }),
    register: (username: string, password: string, role: string, nickname: string, mobile: string) =>
      client.post<AuthSession | AuthSession[]>("/auth/register", { username, password, role, nickname, mobile }),
    upsertPassengerProfile: (passengerId: string, level = "STANDARD", emergencyContact = "13800009999") =>
      client.post<{ passengerId: string; level: string; emergencyContact: string }>("/passengers", {
        passengerId,
        level,
        emergencyContact
      }),
    createTrip: (payload: { passengerId: string; from: string; to: string }) => client.post<TripRecord>("/trips", payload),
    listTrips: (passengerId: string) => client.get<TripRecord[]>(`/trips?passengerId=${encodeURIComponent(passengerId)}`),
    createOrder: (payload: { tripId: string; driverId: string; passengerId: string }) => client.post<OrderRecord>("/orders/create", payload),
    acceptOrder: (orderId: string) => client.post<OrderRecord>(`/orders/${orderId}/accept`),
    completeOrder: (orderId: string) => client.post<OrderRecord>(`/orders/${orderId}/complete`),
    cancelOrder: (orderId: string) => client.post<OrderRecord>(`/orders/${orderId}/cancel`),
    getOrder: (orderId: string) => client.get<OrderRecord>(`/orders/${orderId}`),
    listOrders: (userId: string, status?: string) => {
      const query = status
        ? `/orders?userId=${encodeURIComponent(userId)}&status=${encodeURIComponent(status)}`
        : `/orders?userId=${encodeURIComponent(userId)}`;
      return client.get<OrderRecord[]>(query);
    },
    getTrip: (tripId: string) => client.get<TripRecord>(`/trips/${tripId}`),
    matchDriver: (tripId: string, driverId: string) =>
      client.post<TripRecord>(`/trips/${tripId}/match-driver?driverId=${encodeURIComponent(driverId)}`)
  };
}

export type FlowApi = ReturnType<typeof buildApi>;

