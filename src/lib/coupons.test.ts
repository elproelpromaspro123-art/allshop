import { describe, expect, it } from "vitest";
import {
  evaluateCoupon,
  formatCouponCopAmount,
  normalizeCouponCode,
} from "./coupons";

const baseInput = {
  subtotal: 200_000,
  shippingCost: 12_900,
  items: [{ id: "prod-1", slug: "producto-1", quantity: 1 }],
};

describe("coupons", () => {
  it("normalizes coupon codes safely", () => {
    expect(normalizeCouponCode(" vortixy10 ")).toBe("VORTIXY10");
    expect(normalizeCouponCode("cliente20k<script>")).toBe("CLIENTE20KSCRIPT");
  });

  it("applies a percentage coupon", () => {
    const result = evaluateCoupon({
      ...baseInput,
      code: "VORTIXY10",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected valid coupon");
    expect(result.subtotalDiscount).toBe(20_000);
    expect(result.discountedTotal).toBe(192_900);
  });

  it("applies a fixed coupon", () => {
    const result = evaluateCoupon({
      ...baseInput,
      code: "CLIENTE20K",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected valid coupon");
    expect(result.subtotalDiscount).toBe(20_000);
    expect(result.shippingDiscount).toBe(0);
  });

  it("applies a shipping coupon", () => {
    const result = evaluateCoupon({
      ...baseInput,
      code: "ENVIOVORTI",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected valid coupon");
    expect(result.shippingDiscount).toBe(12_900);
    expect(result.discountedShippingCost).toBe(0);
  });

  it("rejects unknown coupon codes", () => {
    const result = evaluateCoupon({
      ...baseInput,
      code: "NOEXISTE",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid coupon");
    expect(result.errorCode).toBe("COUPON_NOT_FOUND");
  });

  it("requires the minimum subtotal when needed", () => {
    const result = evaluateCoupon({
      ...baseInput,
      code: "CLIENTE20K",
      subtotal: 80_000,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid coupon");
    expect(result.errorCode).toBe("COUPON_MIN_SUBTOTAL");
    expect(result.requiredSubtotal).toBe(180_000);
    expect(result.missingSubtotal).toBe(100_000);
  });

  it("rejects shipping coupons when the order already ships free", () => {
    const result = evaluateCoupon({
      ...baseInput,
      code: "ENVIOVORTI",
      shippingCost: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid coupon");
    expect(result.errorCode).toBe("COUPON_SHIPPING_ALREADY_FREE");
  });

  it("formats coupon amounts in COP", () => {
    expect(formatCouponCopAmount(20_000)).toContain("20");
  });
});
