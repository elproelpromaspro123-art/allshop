import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCsrfToken,
  CsrfClientError,
  fetchWithCsrf,
} from "@/lib/csrf-client";

describe("fetchWithCsrf", () => {
  beforeEach(() => {
    clearCsrfToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearCsrfToken();
  });

  it("attaches a token to same-origin unsafe requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "token-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithCsrf("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      credentials: "same-origin",
      method: "POST",
    });
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("x-csrf-token"),
    ).toBe("token-1");
  });

  it("retries once with a fresh token after a CSRF rejection", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "token-old" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: "CSRF_INVALID" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: "token-new" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithCsrf("/api/orders/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "cliente@mail.com" }),
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("x-csrf-token"),
    ).toBe("token-old");
    expect(
      new Headers(fetchMock.mock.calls[3]?.[1]?.headers).get("x-csrf-token"),
    ).toBe("token-new");
  });

  it("does not fetch a token for safe methods", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWithCsrf("/api/catalog/version", {
      method: "GET",
      cache: "no-store",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/catalog/version",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws a typed error when a protected request cannot obtain a token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithCsrf("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    ).rejects.toBeInstanceOf(CsrfClientError);
  });
});
