import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/admin-route", () => ({
  assertCatalogAdminAccess: vi.fn(),
}));

vi.mock("@/lib/admin-panel-data", () => ({
  listAdminOrderRows: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
}));

import { assertCatalogAdminAccess } from "@/lib/admin-route";
import { listAdminOrderRows } from "@/lib/admin-panel-data";
import { GET } from "./route";

describe("admin orders route", () => {
  const request = new NextRequest("http://localhost:3000/api/admin/orders");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(null);
    vi.mocked(listAdminOrderRows).mockResolvedValue([
      { id: "ord-1", total: 120000, status: "pending" },
    ] as never);
  });

  it("returns the auth response when admin access fails", async () => {
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(
      NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns the admin order rows", async () => {
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].id).toBe("ord-1");
  });
});
