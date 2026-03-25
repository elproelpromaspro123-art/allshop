import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  mockChain,
  mockSupabaseAdmin,
} = vi.hoisted(() => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve: (value: { data: unknown[] | null; error: unknown }) => void) =>
      resolve({ data: [], error: null })),
  };

  const mockSupabaseAdmin = {
    from: vi.fn(() => mockChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return { mockChain, mockSupabaseAdmin };
});

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
  isSupabaseAdminConfigured: true,
}));

vi.mock("@/lib/logger", () => ({
  logger: { securityEvent: vi.fn() },
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
  return { ...actual, getClientIp: vi.fn(() => "127.0.0.1") };
});

vi.mock("@/lib/vpn-detect", () => ({
  isVpnOrProxy: vi.fn().mockResolvedValue({ isVpn: false }),
}));

vi.mock("@/lib/ip-block", () => ({
  isIpBlockedAsync: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/notifications", () => ({
  isEmailConfigured: vi.fn().mockReturnValue(true),
  notifyOrderStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/discord", () => ({
  sendOrderToDiscord: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/order-token", () => ({
  isOrderLookupSecretConfigured: vi.fn().mockReturnValue(true),
  createOrderLookupToken: vi.fn().mockReturnValue("mock-order-token"),
}));

vi.mock("@/lib/catalog-runtime", () => ({
  reserveCatalogStock: vi.fn().mockResolvedValue({
    ok: true,
    reservations: [{ slug: "test-product", variant: null, quantity: 1 }],
  }),
  restoreCatalogStock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/csrf", () => ({
  isCsrfSecretConfigured: vi.fn().mockReturnValue(true),
  validateCsrfToken: vi.fn().mockReturnValue(true),
  validateSameOrigin: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn().mockImplementation(async (input: { key: string }) => {
    if (process.env.TEST_RATE_LIMIT === "exceeded" && input.key.includes("checkout")) {
      return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
    }
    return { allowed: true, remaining: 4 };
  }),
}));

import { POST } from "@/app/api/checkout/route";

const VALID_CHECKOUT_BODY = {
  items: [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      slug: "test-product",
      quantity: 1,
      variant: null,
    },
  ],
  payer: {
    name: "Test User Full Name",
    email: "test@example.com",
    phone: "3001234567",
    document: "1234567890",
  },
  shipping: {
    address: "Calle 123 #45-67, Barrio Centro",
    city: "Bogota",
    department: "Cundinamarca",
    zip: "110111",
    type: "nacional",
    cost: 12900,
  },
  verification: {
    address_confirmed: true,
    availability_confirmed: true,
    product_acknowledged: true,
  },
};

function createCheckoutRequest(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      "x-csrf-token": "valid-csrf-token",
      ...headers,
    },
    body: JSON.stringify(body),
  }) as never;
}

describe("checkout integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEST_RATE_LIMIT;

    mockChain.single.mockResolvedValue({ data: { id: "mock-order-id" }, error: null });
    mockChain.then.mockImplementation(
      (resolve: (value: { data: unknown[] | null; error: unknown }) => void) =>
        resolve({ data: [], error: null }),
    );
  });

  it("accepts a valid checkout and returns order_id", async () => {
    mockChain.then.mockImplementation(
      (resolve: (value: { data: unknown[] | null; error: unknown }) => void) =>
        resolve({
          data: [
            {
              id: "a0000000-0000-0000-0000-000000000001",
              slug: "test-product",
              name: "Test Product",
              price: 50000,
              images: [],
              is_active: true,
              free_shipping: false,
              shipping_cost: null,
            },
          ],
          error: null,
        }),
    );

    const response = await POST(createCheckoutRequest(VALID_CHECKOUT_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.order_id).toBe("mock-order-id");
    expect(data.status).toBe("processing");
    expect(data.redirect_url).toContain("mock-order-id");
  });

  it("rejects missing fields with INVALID_CHECKOUT_FIELDS", async () => {
    const response = await POST(createCheckoutRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("INVALID_CHECKOUT_FIELDS");
  });

  it("rejects invalid phone with INVALID_CHECKOUT_FIELDS", async () => {
    const body = {
      ...VALID_CHECKOUT_BODY,
      payer: { ...VALID_CHECKOUT_BODY.payer, phone: "123" },
    };

    const response = await POST(createCheckoutRequest(body));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("INVALID_CHECKOUT_FIELDS");
    expect(data.field_errors).toHaveProperty("phone");
  });

  it("rejects empty items with INVALID_CHECKOUT_ITEMS", async () => {
    const body = { ...VALID_CHECKOUT_BODY, items: [] };

    const response = await POST(createCheckoutRequest(body));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("INVALID_CHECKOUT_ITEMS");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    process.env.TEST_RATE_LIMIT = "exceeded";

    const response = await POST(createCheckoutRequest(VALID_CHECKOUT_BODY));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.ok).toBe(false);
    expect(data.code).toBe("CHECKOUT_RATE_LIMIT_DB");
  });
});
