import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/admin-route", () => ({
  assertCatalogAdminAccess: vi.fn(),
  enforceAdminRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/admin-panel-data", () => ({
  listAdminInventoryRows: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
}));

import { assertCatalogAdminAccess } from "@/lib/admin-route";
import { listAdminInventoryRows } from "@/lib/admin-panel-data";
import { GET } from "./route";

describe("admin inventory route", () => {
  const request = new NextRequest("http://localhost:3000/api/admin/inventory");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(null);
    vi.mocked(listAdminInventoryRows).mockResolvedValue([
      { id: "prod-1", slug: "airpods-pro-3", stock: 8 },
    ] as never);
  });

  it("returns the auth response when admin access fails", async () => {
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(
      NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns the inventory rows", async () => {
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data[0].slug).toBe("airpods-pro-3");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
