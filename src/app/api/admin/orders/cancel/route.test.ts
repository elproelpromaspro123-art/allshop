import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {},
}));

vi.mock("@/lib/catalog-admin-auth", () => ({
  isAdminActionSecretConfigured: vi.fn(() => true),
  isAdminActionSecretValid: vi.fn(() => true),
  parseBearerToken: vi.fn(() => "secret"),
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
    isUuid: vi.fn((value: string) => value === "550e8400-e29b-41d4-a716-446655440000"),
  };
});

import { checkRateLimitDb } from "@/lib/rate-limit";
import { GET, POST } from "./route";

describe("admin orders cancel route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
  });

  it("rejects invalid order ids before touching Supabase", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/orders/cancel", {
        method: "POST",
        headers: { authorization: "Bearer secret" },
        body: JSON.stringify({ order_id: "not-a-uuid" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects GET requests", async () => {
    const response = await GET();

    expect(response.status).toBe(405);
  });
});
