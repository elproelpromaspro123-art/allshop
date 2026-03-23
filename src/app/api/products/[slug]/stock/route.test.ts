import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/catalog-runtime", () => ({
  getCatalogStockState: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getProductBySlug: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn(),
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

import { getCatalogStockState } from "@/lib/catalog-runtime";
import { getProductBySlug } from "@/lib/db";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { GET } from "./route";

describe("product stock route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
    vi.mocked(getProductBySlug).mockResolvedValue({
      id: "prod-1",
      slug: "airpods-pro-3",
    } as never);
    vi.mocked(getCatalogStockState).mockResolvedValue({
      total_stock: 8,
      variants: [{ name: "Default", stock: 8, variation_id: null }],
      source: "runtime",
      updated_at: "2026-03-22T10:00:00.000Z",
    } as never);
  });

  it("returns rate-limit metadata when blocked", async () => {
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 32,
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/products/airpods-pro-3/stock"),
      { params: Promise.resolve({ slug: "airpods-pro-3" }) },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("32");
  });

  it("returns live stock data with no-cache headers", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/products/airpods-pro-3/stock"),
      { params: Promise.resolve({ slug: "airpods-pro-3" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(data.live).toBe(true);
    expect(data.total_stock).toBe(8);
  });
});
