import { describe, expect, it } from "vitest";
import { createDefaultPricingContext, type PricingContextPayload } from "@/lib/pricing";
import {
  DISPLAY_CURRENCY_STORAGE_KEY,
  PRICING_CONTEXT_SESSION_KEY,
  PRICING_CONTEXT_TTL_MS,
  readCurrencyOverride,
  readPricingContextCache,
  writeCurrencyOverride,
  writePricingContextCache,
  type StorageLike,
} from "./pricing-client";

function createStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

function createPricingPayload(
  overrides: Partial<PricingContextPayload> = {},
): PricingContextPayload {
  return {
    ...createDefaultPricingContext(),
    ...overrides,
  };
}

describe("pricing client helpers", () => {
  it("persists and reads a pricing context cache", () => {
    const storage = createStorage();
    const payload = createPricingPayload({ countryCode: "US", currency: "USD" });

    writePricingContextCache(storage, payload, 1000);

    expect(readPricingContextCache(storage, 1001)).toMatchObject({
      countryCode: "US",
      currency: "USD",
    });
  });

  it("drops expired pricing cache entries", () => {
    const payload = createPricingPayload();
    const storage = createStorage({
      [PRICING_CONTEXT_SESSION_KEY]: JSON.stringify({
        savedAt: 1000,
        payload,
      }),
    });

    expect(readPricingContextCache(storage, 1000 + PRICING_CONTEXT_TTL_MS + 1)).toBeNull();
  });

  it("reads and clears currency overrides safely", () => {
    const storage = createStorage();

    writeCurrencyOverride(storage, "USD");
    expect(readCurrencyOverride(storage)).toBe("USD");

    writeCurrencyOverride(storage, null);
    expect(readCurrencyOverride(storage)).toBeNull();
  });

  it("ignores invalid persisted currency overrides", () => {
    const storage = createStorage({
      [DISPLAY_CURRENCY_STORAGE_KEY]: "BTC",
    });

    expect(readCurrencyOverride(storage)).toBeNull();
  });
});
