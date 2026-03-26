import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
}));

import { getCategories, getProducts } from "@/lib/db";
import { GET } from "./route";

describe("products search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCategories).mockResolvedValue([
      { id: "cat-1", name: "Audio", slug: "audio" },
      { id: "cat-2", name: "Carga", slug: "carga" },
    ] as never);
    vi.mocked(getProducts).mockResolvedValue([
      {
        id: "prod-1",
        slug: "airpods-pro-3",
        name: "Auriculares Pro 3",
        description: "Audifonos premium con cancelacion",
        price: 249900,
        images: ["/airpods.png"],
        category_id: "cat-1",
        is_featured: true,
        is_bestseller: true,
        reviews_count: 12,
        average_rating: 4.8,
        free_shipping: true,
        stock_location: "nacional",
      },
      {
        id: "prod-2",
        slug: "audifonos-urban",
        name: "Audifonos Urban",
        description: "Auriculares bluetooth para ciudad",
        price: 69900,
        images: ["/audifonos.png"],
        category_id: "cat-2",
        is_featured: false,
        is_bestseller: false,
        reviews_count: 3,
        average_rating: 4.2,
        free_shipping: false,
        stock_location: "bogota",
      },
      {
        id: "prod-3",
        slug: "cargador-rapido",
        name: "Cargador rapido",
        description: "Carga turbo para uso diario",
        price: 69900,
        images: ["/cargador.png"],
        category_id: "cat-2",
        is_featured: false,
        is_bestseller: false,
        reviews_count: 1,
        average_rating: 3.7,
        free_shipping: false,
        stock_location: "nacional",
      },
    ] as never);
  });

  it("returns ranked results for a query", async () => {
    const request = new Request("http://localhost:3000/api/products/search?q=auriculares&limit=5");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(2);
    expect(data.products).toHaveLength(2);
    expect(data.products[0]).toMatchObject({
      slug: "airpods-pro-3",
      category_name: "Audio",
      category_slug: "audio",
      is_featured: true,
      is_bestseller: true,
      reviews_count: 12,
      free_shipping: true,
    });
    expect(data.categories).toEqual([
      {
        id: "cat-1",
        name: "Audio",
        slug: "audio",
        count: 1,
      },
      {
        id: "cat-2",
        name: "Carga",
        slug: "carga",
        count: 1,
      },
    ]);
  });

  it("returns default discovery results without a query", async () => {
    const request = new Request("http://localhost:3000/api/products/search?limit=1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(3);
    expect(data.products[0].slug).toBe("airpods-pro-3");
    expect(data.categories).toEqual([
      {
        id: "cat-2",
        name: "Carga",
        slug: "carga",
        count: 2,
      },
      {
        id: "cat-1",
        name: "Audio",
        slug: "audio",
        count: 1,
      },
    ]);
  });
});
