import { describe, it, expect } from "vitest";
import {
  isProductShippingFree,
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
  NATIONAL_SHIPPING_FEE_COP,
} from "@/lib/shipping";

describe("isProductShippingFree", () => {
  it("returns true when freeShipping is true", () => {
    expect(isProductShippingFree({ freeShipping: true })).toBe(true);
  });

  it("returns true when free_shipping is true", () => {
    expect(isProductShippingFree({ free_shipping: true })).toBe(true);
  });

  it("returns false when neither is set", () => {
    expect(isProductShippingFree({})).toBe(false);
  });

  it("returns false when both are false", () => {
    expect(isProductShippingFree({ freeShipping: false, free_shipping: false })).toBe(false);
  });
});

describe("calculateNationalShippingCost", () => {
  it("returns 0 when hasOnlyFreeShippingProducts is true", () => {
    expect(calculateNationalShippingCost({ hasOnlyFreeShippingProducts: true })).toBe(0);
  });

  it("returns default fee when hasOnlyFreeShippingProducts is false and no base cost", () => {
    expect(calculateNationalShippingCost({ hasOnlyFreeShippingProducts: false })).toBe(NATIONAL_SHIPPING_FEE_COP);
  });

  it("returns baseShippingCost when provided", () => {
    expect(calculateNationalShippingCost({ hasOnlyFreeShippingProducts: false, baseShippingCost: 15000 })).toBe(15000);
  });

  it("returns 0 when baseShippingCost is 0", () => {
    expect(calculateNationalShippingCost({ hasOnlyFreeShippingProducts: false, baseShippingCost: 0 })).toBe(0);
  });
});

describe("hasOnlyFreeShippingProducts", () => {
  it("returns false for empty array", () => {
    expect(hasOnlyFreeShippingProducts([])).toBe(false);
  });

  it("returns true when all products have free shipping", () => {
    const products = [
      { freeShipping: true },
      { free_shipping: true },
    ];
    expect(hasOnlyFreeShippingProducts(products)).toBe(true);
  });

  it("returns false when any product does not have free shipping", () => {
    const products = [
      { freeShipping: true },
      {},
    ];
    expect(hasOnlyFreeShippingProducts(products)).toBe(false);
  });
});