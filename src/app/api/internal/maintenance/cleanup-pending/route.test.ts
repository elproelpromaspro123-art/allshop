import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { fromMock, restoreCatalogStockMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  restoreCatalogStockMock: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: fromMock,
  },
}));

vi.mock("@/lib/catalog-runtime", () => ({
  restoreCatalogStock: restoreCatalogStockMock,
}));

import { GET, POST } from "./route";

interface CleanupScenario {
  staleOrders: Array<{
    id: string;
    notes: string | null;
    items: unknown;
  }>;
  productRows?: Array<{ id: string; slug: string }>;
  orderUpdateResults?: Array<{
    data?: unknown;
    error?: { message: string } | null;
  }>;
}

let updateSelectSpy: ReturnType<typeof vi.fn>;

function configureSupabaseScenario(input: CleanupScenario) {
  const scenario = {
    productRows: [] as Array<{ id: string; slug: string }>,
    orderUpdateResults: [] as Array<{
      data?: unknown;
      error?: { message: string } | null;
    }>,
    ...input,
  };

  updateSelectSpy = vi.fn(() =>
    Promise.resolve(
      scenario.orderUpdateResults.shift() || {
        data: [],
        error: null,
      },
    ),
  );

  fromMock.mockImplementation((table: string) => {
    if (table === "orders") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: scenario.staleOrders,
                  error: null,
                }),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: updateSelectSpy,
            })),
          })),
        })),
      };
    }

    if (table === "products") {
      return {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: scenario.productRows,
            error: null,
          }),
        })),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("cleanup pending maintenance route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAINTENANCE_SECRET = "secret-token";
    configureSupabaseScenario({ staleOrders: [] });
  });

  it("rejects GET requests", async () => {
    const response = await GET();

    expect(response.status).toBe(405);
  });

  it("requires the maintenance secret", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/maintenance/cleanup-pending", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("supports dry run previews without mutating orders or stock", async () => {
    configureSupabaseScenario({
      staleOrders: [
        {
          id: "order-1",
          notes: null,
          items: [
            { product_id: "prod-1", variant: "Negro", quantity: 2 },
            { product_id: "missing-product", variant: null, quantity: 1 },
          ],
        },
      ],
      productRows: [{ id: "prod-1", slug: "airpods-pro-3" }],
    });

    const response = await POST(
      new NextRequest(
        "http://localhost:3000/api/internal/maintenance/cleanup-pending?dry_run=1",
        {
          method: "POST",
          headers: {
            "x-maintenance-secret": "secret-token",
          },
        },
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.dry_run).toBe(true);
    expect(data.unresolved_items).toBe(1);
    expect(data.preview).toEqual([
      {
        order_id: "order-1",
        item_count: 2,
        reservable_items: 1,
        unresolved_items: 1,
        stock_restore_needed: true,
      },
    ]);
    expect(updateSelectSpy).not.toHaveBeenCalled();
    expect(restoreCatalogStockMock).not.toHaveBeenCalled();
  });

  it("restores stock only after the cancellation is confirmed", async () => {
    configureSupabaseScenario({
      staleOrders: [
        {
          id: "order-1",
          notes: null,
          items: [{ product_id: "prod-1", variant: "Negro", quantity: 2 }],
        },
      ],
      productRows: [{ id: "prod-1", slug: "airpods-pro-3" }],
      orderUpdateResults: [{ data: [{ id: "order-1" }], error: null }],
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/maintenance/cleanup-pending", {
        method: "POST",
        headers: {
          "x-maintenance-secret": "secret-token",
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cancelled).toBe(1);
    expect(data.restored_stock_for).toBe(1);
    expect(restoreCatalogStockMock).toHaveBeenCalledWith([
      {
        slug: "airpods-pro-3",
        variant: "Negro",
        quantity: 2,
      },
    ]);
    expect(updateSelectSpy.mock.invocationCallOrder[0]).toBeLessThan(
      restoreCatalogStockMock.mock.invocationCallOrder[0],
    );
  });

  it("skips stock restoration when the order is no longer pending", async () => {
    configureSupabaseScenario({
      staleOrders: [
        {
          id: "order-1",
          notes: null,
          items: [{ product_id: "prod-1", variant: "Negro", quantity: 2 }],
        },
      ],
      productRows: [{ id: "prod-1", slug: "airpods-pro-3" }],
      orderUpdateResults: [{ data: [], error: null }],
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/maintenance/cleanup-pending", {
        method: "POST",
        headers: {
          "x-maintenance-secret": "secret-token",
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cancelled).toBe(0);
    expect(data.skipped_not_pending).toBe(1);
    expect(data.restored_stock_for).toBe(0);
    expect(restoreCatalogStockMock).not.toHaveBeenCalled();
  });
});
