import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {},
}));

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

vi.mock("@/lib/order-history-token", () => ({
  createOrderHistoryToken: vi.fn(() => "history-token"),
  isOrderHistorySecretConfigured: vi.fn(() => true),
  verifyOrderHistoryToken: vi.fn(),
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
});
