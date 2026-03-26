import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/admin-route", () => ({
  assertCatalogAdminAccess: vi.fn(),
  enforceAdminRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/admin-panel-data", () => ({
  getAdminInventoryStats: vi.fn(() => ({
    totalProducts: 3,
    lowStockProducts: 1,
    outOfStockProducts: 1,
  })),
  listAdminInventoryRows: vi.fn(),
  listAdminOrderRows: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
}));

import { assertCatalogAdminAccess } from "@/lib/admin-route";
import {
  listAdminInventoryRows,
  listAdminOrderRows,
} from "@/lib/admin-panel-data";
import { GET } from "./route";

describe("admin metrics route", () => {
  const request = new NextRequest("http://localhost:3000/api/admin/metrics");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(null);
    const recentDate = new Date().toISOString();
    const olderDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(listAdminOrderRows).mockResolvedValue([
      { id: "ord-1", total: 100000, status: "pending", created_at: olderDate },
      {
        id: "ord-2",
        total: 50000,
        status: "processing",
        created_at: recentDate,
      },
      { id: "ord-3", total: 75000, status: "shipped", created_at: recentDate },
      { id: "ord-4", total: 50000, status: "delivered", created_at: recentDate },
      { id: "ord-5", total: 25000, status: "cancelled", created_at: recentDate },
    ] as never);
    vi.mocked(listAdminInventoryRows).mockResolvedValue([
      { id: "prod-1", stock: 8, is_active: true },
      { id: "prod-2", stock: 4, is_active: false },
      { id: "prod-3", stock: 0, is_active: false },
    ] as never);
  });

  it("returns the auth response when admin access fails", async () => {
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(
      NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns the dashboard metrics payload", async () => {
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data.totalOrders).toBe(5);
    expect(data.data.totalRevenue).toBe(300000);
    expect(data.data.averageOrderValue).toBe(60000);
    expect(data.data.recentRevenue).toBe(200000);
    expect(data.data.ordersThisWeek).toBe(4);
    expect(data.data.fulfillmentRate).toBe(0.2);
    expect(data.data.activeProducts).toBe(1);
    expect(data.data.totalProducts).toBe(3);
    expect(data.data.inactiveProducts).toBe(2);
    expect(data.data.backlogOrders).toBe(2);
    expect(data.data.inventoryPressure).toBe(2);
    expect(data.data.catalogCoverage).toBeCloseTo(1 / 3);
    expect(data.data.recentOrders).toHaveLength(5);
    expect(data.data.recentOrders[0].id).toBe("ord-2");
    expect(data.data.recentOrders[4].id).toBe("ord-1");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
