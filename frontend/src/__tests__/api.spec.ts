import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "../api";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("injects bearer token and parses wrapped response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 200, message: "ok", data: { id: "x" }, timestamp: Date.now(), traceId: "t-1" })
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
});
