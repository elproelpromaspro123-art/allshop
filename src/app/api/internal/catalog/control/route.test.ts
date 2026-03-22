import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

import { isCatalogAdminAuthorized, isCatalogAdminCodeConfigured } from "@/lib/catalog-admin-auth";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/catalog-admin-auth", () => ({
  isCatalogAdminCodeConfigured: vi.fn(),
  isCatalogAdminPathTokenConfigured: vi.fn(),
  isCatalogAdminAuthorized: vi.fn(),
}));

import { listCatalogControlProducts, updateCatalogControlProduct } from "@/lib/catalog-runtime";
import { checkRateLimitDb } from "@/lib/rate-limit";

vi.mock("@/lib/catalog-runtime", () => ({
  listCatalogControlProducts: vi.fn(),
  updateCatalogControlProduct: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn().mockResolvedValue({ allowed: true, remaining: 10 }),
}));

interface MockCatalogProduct {
  slug: string;
  name: string;
}

describe("Catalog Control API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({ allowed: true, remaining: 10 });
    vi.mocked(listCatalogControlProducts).mockResolvedValue({
      version: "1",
      updated_at: new Date().toISOString(),
      runtime_table_ready: true,
      products: [{ slug: "prod-1", name: "Test Product" } as MockCatalogProduct],
    });
    vi.mocked(updateCatalogControlProduct).mockResolvedValue({ slug: "prod-1", name: "Test Product" } as MockCatalogProduct);
  });

  describe("GET handler", () => {
    it("should reject unauthorized requests", async () => {
      vi.mocked(isCatalogAdminCodeConfigured).mockReturnValue(true);
      vi.mocked(isCatalogAdminAuthorized).mockReturnValue(false);
      
      const req = new NextRequest("http://localhost:3000/api/internal/catalog/control");
      const response = await GET(req);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Código de acceso inválido.");
    });

    it("should return products when authorized", async () => {
      vi.mocked(isCatalogAdminCodeConfigured).mockReturnValue(true);
      vi.mocked(isCatalogAdminAuthorized).mockReturnValue(true);
      
      const req = new NextRequest("http://localhost:3000/api/internal/catalog/control");
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.products).toHaveLength(1);
      expect(data.products[0].name).toBe("Test Product");
    });
  });

  describe("PATCH handler", () => {
    it("should reject invalid updates (missing product ID)", async () => {
      vi.mocked(isCatalogAdminCodeConfigured).mockReturnValue(true);
      vi.mocked(isCatalogAdminAuthorized).mockReturnValue(true);
      
      const req = new NextRequest("http://localhost:3000/api/internal/catalog/control", {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      });
      
      const response = await PATCH(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("El slug del producto es obligatorio.");
    });

    it("should update a product successfully", async () => {
      vi.mocked(isCatalogAdminCodeConfigured).mockReturnValue(true);
      vi.mocked(isCatalogAdminAuthorized).mockReturnValue(true);
      
      const req = new NextRequest("http://localhost:3000/api/internal/catalog/control", {
        method: "PATCH",
        body: JSON.stringify({ slug: "prod-1", price: 50000 }),
      });
      
      const response = await PATCH(req);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.updated.slug).toBe("prod-1");
    });
  });
});
