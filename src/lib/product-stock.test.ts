import { describe, expect, it } from "vitest";
import {
  isProductLowStockBadgeVisible,
  resolveProductTotalStock,
} from "@/lib/product-stock";

describe("product-stock", () => {
  it("uses explicit total stock when available", () => {
    expect(
      resolveProductTotalStock({
        slug: "audifonos-xiaomi-redmi-buds-4-lite",
        total_stock: 12,
      }),
    ).toBe(12);
  });

  it("falls back to manual stock snapshot by slug", () => {
    expect(
      resolveProductTotalStock({
        slug: "camara-seguridad-bombillo-360-wifi",
      }),
    ).toBe(150);
  });

  it("only shows low stock badge for real low stock", () => {
    expect(
      isProductLowStockBadgeVisible({
        slug: "audifonos-xiaomi-redmi-buds-4-lite",
      }),
    ).toBe(false);

    expect(
      isProductLowStockBadgeVisible({
        slug: "airpods-pro-3",
      }),
    ).toBe(false);

    expect(
      isProductLowStockBadgeVisible({
        slug: "airpods-pro-3",
        total_stock: 8,
      }),
    ).toBe(true);
  });
});
