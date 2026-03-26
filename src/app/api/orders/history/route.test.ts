import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockOrderRows = [
  {
    id: "order-1",
    status: "processing",
    total: 125000,
    created_at: "2026-03-22T10:00:00.000Z",
    updated_at: "2026-03-22T10:10:00.000Z",
    customer_document: "12345678",
  },
];

vi.mock("@/lib/csrf", () => ({
  validateCsrfToken: vi.fn(() => true),
  validateSameOrigin: vi.fn(() => true),
}));

vi.mock("@/lib/supabase-admin", () => {
  const mockQuery: {
    eq?: ReturnType<typeof vi.fn>;
    order?: ReturnType<typeof vi.fn>;
    limit?: ReturnType<typeof vi.fn>;
  } = {};

  mockQuery.eq = vi.fn(() => mockQuery);
  mockQuery.order = vi.fn(() => mockQuery);
  mockQuery.limit = vi.fn(() => Promise.resolve({ data: mockOrderRows }));

  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => mockQuery),
      })),
    },
  };
});

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn(),
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils")>(
    "@/lib/utils",
  );

  return {
    ...actual,
    getClientIp: vi.fn(() => "127.0.0.1"),
  };
});

vi.mock("@/lib/order-token", () => ({
  createOrderLookupToken: vi.fn(() => "lookup-token"),
}));

vi.mock("@/lib/phone", () => ({
  getPhoneLookupCandidates: vi.fn(() => ["573001234567"]),
  normalizePhone: vi.fn((value: string) => value.replace(/\D+/g, "")),
}));

vi.mock("@/lib/order-history-token", () => ({
  createOrderHistoryToken: vi.fn(() => "history-token"),
  isOrderHistorySecretConfigured: vi.fn(() => true),
  verifyOrderHistoryToken: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  isEmailConfigured: vi.fn(() => true),
  sendOrderHistoryAccessEmail: vi.fn().mockResolvedValue(undefined),
}));

import { checkRateLimitDb } from "@/lib/rate-limit";
import { verifyOrderHistoryToken } from "@/lib/order-history-token";
import { POST } from "./route";

describe("orders history route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 5,
      retryAfterSeconds: 60,
    });
    vi.mocked(verifyOrderHistoryToken).mockReturnValue(null);
  });

  it("rejects invalid emails in the identity flow", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/orders/history", {
        method: "POST",
        body: JSON.stringify({
          email: "correo-invalido",
          phone: "3001234567",
          document: "12345678",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects non-object JSON bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/orders/history", {
        method: "POST",
        body: "[]",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects invalid secure access tokens", async () => {
    vi.mocked(verifyOrderHistoryToken).mockReturnValue(null);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/orders/history", {
        method: "POST",
        body: JSON.stringify({
          token: "bad-token",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns rate limit metadata when the IP exceeds the lookup quota", async () => {
    vi.mocked(checkRateLimitDb).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 90,
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/orders/history", {
        method: "POST",
        body: JSON.stringify({
          email: "cliente@ejemplo.com",
          phone: "3001234567",
          document: "12345678",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(payload.code).toBe("RATE_LIMIT_EXCEEDED");
  });
});
