import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => {
  const state: {
    existingOrder: {
      id: string;
      status: string | null;
      notes: string | null;
    } | null;
  } = {
    existingOrder: null,
  };

  const maybeSingle = vi.fn(async () => ({
    data: state.existingOrder,
    error: null,
  }));

  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle,
    })),
  }));

  const from = vi.fn(() => ({
    select,
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: { id: "order-created" },
          error: null,
        })),
      })),
    })),
  }));

  return { state, maybeSingle, select, from };
});

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
  isSupabaseAdminConfigured: true,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn(async () => ({
    allowed: true,
    retryAfterSeconds: null,
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    securityEvent: vi.fn(),
    checkoutEvent: vi.fn(),
  },
}));

vi.mock("@/lib/csrf", () => ({
  isCsrfSecretConfigured: vi.fn(() => true),
  validateCsrfToken: vi.fn(() => true),
  validateSameOrigin: vi.fn(() => true),
}));

vi.mock("@/lib/ip-block", () => ({
  isIpBlockedAsync: vi.fn(async () => false),
}));

vi.mock("@/lib/vpn-detect", () => ({
  isVpnOrProxy: vi.fn(async () => ({ isVpn: false, reason: null })),
}));

vi.mock("@/lib/order-token", () => ({
  createOrderLookupToken: vi.fn(() => "order-token"),
  isOrderLookupSecretConfigured: vi.fn(() => false),
}));

vi.mock("@/lib/notifications", () => ({
  isEmailConfigured: vi.fn(() => false),
  notifyOrderStatus: vi.fn(),
}));

vi.mock("@/lib/discord", () => ({
  sendOrderToDiscord: vi.fn(),
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

import { logger } from "@/lib/logger";
import { POST } from "./route";

describe("checkout route", () => {
  beforeEach(() => {
    mocks.state.existingOrder = null;
    vi.clearAllMocks();
  });

  function buildRequest(body: Record<string, unknown>, idempotencyKey = "abcDEF_123-xyz") {
    return new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(JSON.stringify(body).length),
        "x-csrf-token": "token-ok",
        "x-idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });
  }

  function buildValidBody(overrides: Record<string, unknown> = {}) {
    return {
      items: [{ id: "prod-1", slug: "producto-1", quantity: 1 }],
      payer: {
        name: "Carlos Garcia Lopez",
        email: "carlos@example.com",
        phone: "3105557890",
        document: "1234567890",
      },
      shipping: {
        address: "Calle 45 #12-34, Barrio Centro",
        reference: "Tercer piso",
        city: "Bogota",
        department: "Cundinamarca",
        type: "nacional",
        cost: 12900,
      },
      verification: {
        address_confirmed: true,
        availability_confirmed: true,
        product_acknowledged: true,
      },
      pricing: {
        display_currency: "COP",
        display_locale: "es-CO",
        country_code: "CO",
        display_rate: 1,
      },
      ...overrides,
    };
  }

  it("rejects oversized requests before deeper processing", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-length": String(60 * 1024),
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.code).toBe("REQUEST_TOO_LARGE");
    expect(logger.securityEvent).toHaveBeenCalledWith(
      "suspicious_activity",
      expect.objectContaining({
        type: "oversized_checkout_request",
      }),
    );
  });

  it("replays a stored order even if email config is unavailable", async () => {
    mocks.state.existingOrder = {
      id: "order-123",
      status: "processing",
      notes: null,
    };

    const response = await POST(buildRequest(buildValidBody()));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.idempotent_replay).toBe(true);
    expect(data.order_id).toBe("order-123");
    expect(data.order_token).toBe("order-token");
    expect(data.redirect_url).toContain("order_id=order-123");
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("rejects idempotency replays when the stored payload hash differs", async () => {
    mocks.state.existingOrder = {
      id: "order-456",
      status: "processing",
      notes: JSON.stringify({
        checkout_payload_hash: "different-fingerprint",
      }),
    };

    const response = await POST(
      buildRequest(
        buildValidBody({
          shipping: {
            address: "Calle 45 #12-34, Barrio Centro",
            reference: "Tercer piso",
            city: "Bogota",
            department: "Cundinamarca",
            type: "nacional",
            cost: 14900,
          },
        }),
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe("IDEMPOTENCY_PAYLOAD_MISMATCH");
    expect(data.existing_order_id).toBe("order-456");
    expect(data.ok).toBe(false);
  });
});
