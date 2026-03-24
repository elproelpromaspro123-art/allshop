import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/admin-route", () => ({
  assertCatalogAdminAccess: vi.fn(),
  enforceAdminRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/admin-panel-data", () => ({
  buildAdminRecentOrders: vi.fn(() => [{ id: "ord-1", total: 120000 }]),
  getAdminInventoryStats: vi.fn(() => ({
    totalProducts: 3,
    lowStockProducts: 1,
    outOfStockProducts: 0,
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
    vi.mocked(listAdminOrderRows).mockResolvedValue([
      { id: "ord-1", total: 100000, status: "pending" },
      { id: "ord-2", total: 200000, status: "processing" },
    ] as never);
    vi.mocked(listAdminInventoryRows).mockResolvedValue([
      { id: "prod-1", stock: 8 },
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
    expect(data.data.totalOrders).toBe(2);
    expect(data.data.totalRevenue).toBe(300000);
    expect(data.data.totalProducts).toBe(3);
    expect(data.data.recentOrders).toHaveLength(1);
  });
});
