import { describe, it, expect } from "vitest";
import {
  sanitizeCountryCode,
  resolveCurrency,
  getFallbackRates,
  resolveLocaleFromAcceptLanguage,
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
} from "@/lib/pricing";

describe("sanitizeCountryCode", () => {
  it("returns CO for null/undefined/empty", () => {
    expect(sanitizeCountryCode(null)).toBe("CO");
    expect(sanitizeCountryCode(undefined)).toBe("CO");
    expect(sanitizeCountryCode("")).toBe("CO");
  });

  it("returns uppercase 2-letter code", () => {
    expect(sanitizeCountryCode("co")).toBe("CO");
    expect(sanitizeCountryCode("us")).toBe("US");
    expect(sanitizeCountryCode("mx")).toBe("MX");
  });

  it("returns CO for invalid values", () => {
    expect(sanitizeCountryCode("COL")).toBe("CO");
    expect(sanitizeCountryCode("123")).toBe("CO");
    expect(sanitizeCountryCode("united states")).toBe("CO");
  });
});

describe("resolveCurrency", () => {
  it("resolves CO to COP", () => {
    expect(resolveCurrency("CO", "es-CO")).toBe("COP");
  });

  it("resolves US to USD", () => {
    expect(resolveCurrency("US", "en-US")).toBe("USD");
  });

  it("falls back to locale when country not found", () => {
    expect(resolveCurrency("XX", "pt-BR")).toBe("BRL");
    expect(resolveCurrency("XX", "en-US")).toBe("USD");
  });

  it("falls back to COP when nothing matches", () => {
    expect(resolveCurrency("XX", "xx-XX")).toBe("COP");
  });
});

describe("getFallbackRates", () => {
  it("returns object with all supported currencies", () => {
    const rates = getFallbackRates();
    for (const currency of SUPPORTED_CURRENCIES) {
      expect(rates).toHaveProperty(currency);
    }
  });

  it("COP rate is always 1", () => {
    expect(getFallbackRates().COP).toBe(1);
  });
});

describe("resolveLocaleFromAcceptLanguage", () => {
  it("returns es-CO for null/undefined", () => {
    expect(resolveLocaleFromAcceptLanguage(null)).toBe("es-CO");
    expect(resolveLocaleFromAcceptLanguage(undefined)).toBe("es-CO");
  });

  it("parses single language tag", () => {
    expect(resolveLocaleFromAcceptLanguage("en-US")).toBe("en-US");
    expect(resolveLocaleFromAcceptLanguage("es-CO")).toBe("es-CO");
  });

  it("takes first language from comma-separated list", () => {
    expect(resolveLocaleFromAcceptLanguage("en-US,en;q=0.9,es;q=0.8")).toBe("en-US");
  });

  it("strips quality values", () => {
    expect(resolveLocaleFromAcceptLanguage("en;q=0.9")).toBe("en");
  });
});

describe("BASE_CURRENCY", () => {
  it("is COP", () => {
    expect(BASE_CURRENCY).toBe("COP");
  });
});

describe("SUPPORTED_CURRENCIES", () => {
  it("includes major currencies", () => {
    expect(SUPPORTED_CURRENCIES).toContain("COP");
    expect(SUPPORTED_CURRENCIES).toContain("USD");
    expect(SUPPORTED_CURRENCIES).toContain("EUR");
  });
});