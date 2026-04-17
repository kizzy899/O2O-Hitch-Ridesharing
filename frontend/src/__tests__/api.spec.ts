import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient, createApi } from "../api";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("injects bearer token and parses wrapped response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 0, message: "ok", data: { id: "x" }, timestamp: Date.now(), traceId: "t-1" })
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new ApiClient("http://localhost:9000/api", () => "abc");
    const data = await client.get<{ id: string }>("/orders/1");

    expect(data.id).toBe("x");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9000/api/orders/1",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" })
      })
    );
  });

  it("calls register endpoint with expected payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 0,
        message: "ok",
        data: { token: "t-1", userId: "passenger002", role: "PASSENGER" },
        timestamp: Date.now(),
        traceId: "t-2"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const api = createApi(() => "");
    await api.register("passenger002", "123456", "PASSENGER", "passenger-2", "13800001021");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:9000/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          username: "passenger002",
          password: "123456",
          role: "PASSENGER",
          nickname: "passenger-2",
          mobile: "13800001021"
        })
      })
    );
  });
});
