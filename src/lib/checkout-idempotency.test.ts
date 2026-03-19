import { describe, expect, it } from "vitest";
import {
  isDuplicateOrderPaymentIdError,
  normalizeCheckoutIdempotencyKey,
  toCheckoutPaymentId,
} from "./checkout-idempotency";

describe("checkout idempotency helpers", () => {
  it("normalizes valid keys and removes unsafe chars", () => {
    const value = normalizeCheckoutIdempotencyKey(
      "  abcDEF_123-xyz::token!!@@  ",
    );
    expect(value).toBe("abcDEF_123-xyz::token");
  });

  it("rejects empty and too-short values", () => {
    expect(normalizeCheckoutIdempotencyKey(null)).toBeNull();
    expect(normalizeCheckoutIdempotencyKey("short")).toBeNull();
  });

  it("maps normalized key to payment id", () => {
    expect(toCheckoutPaymentId("abc123456789")).toBe("manual_cod:abc123456789");
    expect(toCheckoutPaymentId(null)).toBeNull();
  });

  it("detects unique violation for payment_id index", () => {
    expect(
      isDuplicateOrderPaymentIdError({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "idx_orders_payment_unique"',
      }),
    ).toBe(true);
    expect(
      isDuplicateOrderPaymentIdError({
        code: "23505",
        message:
          "duplicate key value violates unique constraint on something_else",
      }),
    ).toBe(false);
  });
});
