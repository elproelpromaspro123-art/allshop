import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/csrf", () => ({
  validateCsrfToken: vi.fn(() => true),
  validateSameOrigin: vi.fn(() => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn(async () => ({
    allowed: true,
    remaining: 10,
    retryAfterSeconds: 60,
  })),
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

import { checkRateLimitDb } from "@/lib/rate-limit";
import { POST } from "./route";

describe("coupon validation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 10,
      retryAfterSeconds: 60,
    });
  });

  it("rejects invalid json bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns a rate limit error when the quota is exhausted", async () => {
    vi.mocked(checkRateLimitDb).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({
          code: "VORTIXY10",
          subtotal: 200000,
          shippingCost: 12900,
          items: [{ id: "prod-1", quantity: 1 }],
        }),
      }),
    );

    expect(response.status).toBe(429);
  });

  it("validates a working coupon", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code: "vortixy10",
          subtotal: 200000,
          shippingCost: 12900,
          items: [{ id: "prod-1", slug: "producto-1", quantity: 1 }],
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.application.normalizedCode).toBe("VORTIXY10");
    expect(data.application.totalDiscount).toBe(20000);
  });

  it("returns the coupon application failure payload when the code does not apply", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({
          code: "CLIENTE20K",
          subtotal: 100000,
          shippingCost: 12900,
          items: [{ id: "prod-1", slug: "producto-1", quantity: 1 }],
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("COUPON_MIN_SUBTOTAL");
    expect(data.application.ok).toBe(false);
  });
});
