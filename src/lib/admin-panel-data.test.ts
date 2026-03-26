import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AdminInventoryRow, AdminOrderRow } from "@/types/api";

vi.mock("@/lib/catalog-runtime", () => ({
  listCatalogControlProducts: vi.fn(async () => ({
    version: "test",
    updated_at: null,
    runtime_table_ready: true,
    products: [],
  })),
}));

let adminPanelData: typeof import("@/lib/admin-panel-data");

beforeAll(async () => {
  adminPanelData = await import("@/lib/admin-panel-data");
});

describe("admin-panel-data", () => {
  it("computes inventory stats from operational stock", () => {
    const rows: AdminInventoryRow[] = [
      {
        id: "prod-1",
        name: "A",
        slug: "a",
        price: 1000,
        stock: 4,
        is_active: true,
        category_id: "cat-1",
      },
      {
        id: "prod-2",
        name: "B",
        slug: "b",
        price: 2000,
        stock: 0,
        is_active: true,
        category_id: "cat-1",
      },
      {
        id: "prod-3",
        name: "C",
        slug: "c",
        price: 3000,
        stock: 18,
        is_active: false,
        category_id: "cat-2",
      },
    ];

    expect(adminPanelData.ADMIN_LOW_STOCK_THRESHOLD).toBe(5);
    expect(adminPanelData.getAdminInventoryStats(rows)).toEqual({
      totalProducts: 3,
      lowStockProducts: 1,
      outOfStockProducts: 1,
    });
  });

  it("builds recent orders without changing order priority", () => {
    const orders: AdminOrderRow[] = [
      {
        id: "1",
        customer_name: "Ana",
        email: "ana@example.com",
        phone: "3000000001",
        total: 100000,
        status: "pending",
        created_at: "2026-03-21T08:00:00.000Z",
      },
      {
        id: "2",
        customer_name: "Luis",
        email: "luis@example.com",
        phone: "3000000002",
        total: 120000,
        status: "processing",
        created_at: "2026-03-22T09:00:00.000Z",
      },
      {
        id: "3",
        customer_name: "Marta",
        email: "marta@example.com",
        phone: "3000000003",
        total: 130000,
        status: "delivered",
        created_at: "invalid-date",
      },
    ];

    expect(adminPanelData.buildAdminRecentOrders(orders, 1)).toEqual([
      {
        id: "2",
        customer_name: "Luis",
        total: 120000,
        status: "processing",
        created_at: "2026-03-22T09:00:00.000Z",
      },
    ]);
  });
});
