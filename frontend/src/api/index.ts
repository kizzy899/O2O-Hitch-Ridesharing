import type { ApiEnvelope, AuthSession, OrderRecord, TripRecord } from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000/api";

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

  constructor(baseUrl: string, tokenProvider: () => string = () => "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.tokenProvider = tokenProvider;
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

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const envelope = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || envelope.code !== 200) {
      throw new ApiError(envelope.message || "请求失败", response.status, envelope.traceId, envelope);
    }

    return envelope.data;
  }
}

export function createApi(tokenProvider: () => string): ReturnType<typeof buildApi> {
  const client = new ApiClient(API_BASE_URL, tokenProvider);
  return buildApi(client);
}

function buildApi(client: ApiClient) {
  return {
    login: (username: string, password: string) => client.post<AuthSession | AuthSession[]>("/auth/login", { username, password }),
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
