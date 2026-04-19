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

function parseEnvelope<T>(raw: unknown): ApiEnvelope<T> {
  if (!raw || typeof raw !== "object") {
    throw new ApiError("响应格式错误", 500, undefined, raw);
  }

  const envelope = raw as Partial<ApiEnvelope<T>>;
  return {
    code: typeof envelope.code === "number" ? envelope.code : -1,
    message: typeof envelope.message === "string" ? envelope.message : "请求失败",
    data: envelope.data as T,
    timestamp: envelope.timestamp,
    traceId: envelope.traceId
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { code: response.ok ? 0 : response.status, message: text, data: null };
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

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "网络异常，请检查服务是否启动";
      this.hooks?.onError?.({ method, path, requestBody: body, errorMessage: message });
      throw new ApiError(message, 0);
    }

    let rawBody: unknown;
    try {
      rawBody = await parseResponseBody(response);
    } catch {
      rawBody = { code: response.status, message: "响应解析失败", data: null };
    }

    const envelope = parseEnvelope<T>(rawBody);

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
    listTrips: (passengerId?: string, status?: string) => {
      const params = new URLSearchParams();
      if (passengerId) params.append("passengerId", passengerId);
      if (status) params.append("status", status);
      const query = params.toString();
      return client.get<TripRecord[]>(query ? `/trips?${query}` : "/trips");
    },
    listAllPublishedTrips: () => client.get<TripRecord[]>("/trips?status=PUBLISHED"),
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
      client.post<TripRecord>(`/trips/${tripId}/match-driver?driverId=${encodeURIComponent(driverId)}`),
    getDriverAvailability: (driverId: string) =>
      client.get<{ driverId: string; available: boolean; servedBy?: string }>(`/drivers/${driverId}/availability`),
    setDriverAvailability: (driverId: string, available: boolean) =>
      client.put<{ driverId: string; available: boolean }>(`/drivers/${driverId}/availability`, { available })
  };
}

export type FlowApi = ReturnType<typeof buildApi>;

