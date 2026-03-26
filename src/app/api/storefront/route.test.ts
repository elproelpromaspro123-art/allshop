import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getCategories: vi.fn(),
  getFeaturedProducts: vi.fn(),
}));

import { getCategories, getFeaturedProducts } from "@/lib/db";
import { GET } from "./route";

describe("storefront route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns storefront payload with cache headers", async () => {
    vi.mocked(getCategories).mockResolvedValue([
      { id: "cat-1", slug: "audio", name: "Audio" },
    ] as never);
    vi.mocked(getFeaturedProducts).mockResolvedValue([
      { id: "prod-1", slug: "airpods-pro-3", name: "AirPods Pro 3" },
    ] as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=60");
    expect(data.categories).toHaveLength(1);
    expect(data.featuredProducts).toHaveLength(1);
    expect(data.summary).toMatchObject({
      categoryCount: 1,
      featuredCount: 1,
    });
    expect(typeof data.generatedAt).toBe("string");
  });

  it("returns 500 when storefront loaders fail", async () => {
    vi.mocked(getCategories).mockRejectedValue(new Error("db down"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: "No se pudo cargar el storefront.",
    });
  });
});
