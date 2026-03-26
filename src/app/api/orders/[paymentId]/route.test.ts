import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const maybeSingleMock = vi.fn();
const selectMock = vi.fn(() => ({
  eq: vi.fn(() => ({
    maybeSingle: maybeSingleMock,
  })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: selectMock,
    })),
  },
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
    isUuid: vi.fn(
      (value: string) => value === "550e8400-e29b-41d4-a716-446655440000",
    ),
  };
});

vi.mock("@/lib/order-tracking", () => ({
  buildManualFulfillmentSummary: vi.fn(() => ({
    stage: "processing",
  })),
}));

vi.mock("@/lib/order-token", () => ({
  isOrderLookupSecretConfigured: vi.fn(() => true),
  verifyOrderLookupToken: vi.fn(),
}));

import { checkRateLimitDb } from "@/lib/rate-limit";
import { verifyOrderLookupToken } from "@/lib/order-token";
import { GET } from "./route";

describe("orders paymentId route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingleMock.mockResolvedValue({
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "processing",
        items: [],
        subtotal: 100000,
        shipping_cost: 0,
        total: 100000,
        created_at: "2026-03-22T10:00:00.000Z",
        updated_at: "2026-03-22T10:00:00.000Z",
        notes: null,
      },
    });
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 5,
      retryAfterSeconds: 60,
    });
    vi.mocked(verifyOrderLookupToken).mockReturnValue(true);
  });

  it("returns null for invalid order ids", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/orders/not-a-uuid"),
      { params: Promise.resolve({ paymentId: "not-a-uuid" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order).toBeNull();
  });

  it("requires a valid signed lookup token when the secret is configured", async () => {
    vi.mocked(verifyOrderLookupToken).mockReturnValue(false);

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000?token=bad",
      ),
      {
        params: Promise.resolve({
          paymentId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns a 500 when the order query fails", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: new Error("query failed"),
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000?token=ok",
      ),
      {
        params: Promise.resolve({
          paymentId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );

    expect(response.status).toBe(500);
  });

  it("returns the sanitized order lookup payload", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000?token=ok",
      ),
      {
        params: Promise.resolve({
          paymentId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(data.fulfillment.stage).toBe("processing");
  });
});
