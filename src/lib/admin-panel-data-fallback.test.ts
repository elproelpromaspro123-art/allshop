import { beforeEach, describe, expect, it, vi } from "vitest";

describe("admin-panel-data fallbacks", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns an empty order list when supabase admin is not configured", async () => {
    vi.doMock("@/lib/catalog-runtime", () => ({
      listCatalogControlProducts: vi.fn(async () => ({
        version: "test",
        updated_at: null,
        runtime_table_ready: true,
        products: [],
      })),
    }));
    vi.doMock("@/lib/manual-stock", () => ({
      getManualStockSnapshot: vi.fn(() => null),
    }));
    vi.doMock("@/lib/supabase-admin", () => ({
      isSupabaseAdminConfigured: false,
      supabaseAdmin: {
        from: vi.fn(),
      },
    }));

    const adminPanelData = await import("./admin-panel-data");

    await expect(adminPanelData.listAdminOrderRows()).resolves.toEqual([]);
  });

  it("falls back to mock inventory rows when supabase admin is not configured", async () => {
    vi.doMock("@/lib/catalog-runtime", () => ({
      listCatalogControlProducts: vi.fn(async () => ({
        version: "test",
        updated_at: null,
        runtime_table_ready: true,
        products: [],
      })),
    }));
    vi.doMock("@/lib/manual-stock", () => ({
      getManualStockSnapshot: vi.fn(() => null),
    }));
    vi.doMock("@/lib/supabase-admin", () => ({
      isSupabaseAdminConfigured: false,
      supabaseAdmin: {
        from: vi.fn(),
      },
    }));

    const adminPanelData = await import("./admin-panel-data");
    const rows = await adminPanelData.listAdminInventoryRows();

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      slug: expect.any(String),
      price: expect.any(Number),
      stock: expect.any(Number),
      is_active: expect.any(Boolean),
      category_id: expect.any(String),
    });
  });
});
