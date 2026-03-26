import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn(),
}));

vi.mock("@/lib/csrf", () => ({
  validateCsrfToken: vi.fn(),
  validateSameOrigin: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { checkRateLimitDb } from "@/lib/rate-limit";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { POST } from "./route";

describe("analytics events route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateSameOrigin).mockReturnValue(true);
    vi.mocked(validateCsrfToken).mockReturnValue(true);
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      retryAfterSeconds: null,
      remaining: 100,
    } as never);
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as never);
  });

  it("stores a valid analytics event", async () => {
    const request = new NextRequest("http://localhost:3000/api/analytics/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "valid-token",
      },
      body: JSON.stringify({
        session_id: "session-123",
        event_type: "view_content",
        product_id: "prod-1",
        pathname: "/producto/airpods-pro-3",
        metadata: {
          source: "product_page",
          price: 249900,
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.ok).toBe(true);
    expect(data.accepted).toBe(true);
    expect(data.stored).toBe(true);
  });

  it("returns 400 for invalid analytics payloads", async () => {
    const request = new NextRequest("http://localhost:3000/api/analytics/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "valid-token",
      },
      body: JSON.stringify({
        session_id: "",
        event_type: "unknown-event",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("INVALID_ANALYTICS_EVENT");
  });

  it("returns 500 when analytics persistence fails", async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: { message: "db down" },
      }),
    } as never);

    const request = new NextRequest("http://localhost:3000/api/analytics/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "valid-token",
      },
      body: JSON.stringify({
        session_id: "session-123",
        event_type: "view_wishlist",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("ANALYTICS_PERSISTENCE_FAILED");
  });
});
