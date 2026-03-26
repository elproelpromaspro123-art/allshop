import { describe, it, expect } from "vitest";
import { cn, formatPrice, formatPriceUSD, calculateDiscount, slugify, isUuid, getClientIp, isValidIpAddress } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatPrice", () => {
  it("formats COP currency", () => {
    expect(formatPrice(100000)).toContain("100.000");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toContain("0");
  });

  it("handles large numbers", () => {
    expect(formatPrice(5000000)).toContain("5.000.000");
  });
});

describe("formatPriceUSD", () => {
  it("formats USD currency", () => {
    const result = formatPriceUSD(99.99);
    expect(result).toContain("99.99");
  });
});

describe("calculateDiscount", () => {
  it("calculates percentage discount", () => {
    expect(calculateDiscount(100, 200)).toBe(50);
  });

  it("returns 0 when no discount", () => {
    expect(calculateDiscount(100, 80)).toBe(0);
  });

  it("returns 0 when equal prices", () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it("returns 0 when compareAtPrice is lower", () => {
    expect(calculateDiscount(100, 50)).toBe(0);
  });
});

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Hola Mundo")).toBe("hola-mundo");
  });

  it("removes accents", () => {
    expect(slugify("auriculares")).toBe("auriculares");
  });

  it("removes special chars", () => {
    expect(slugify("Producto!@#$%")).toBe("producto");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("-Producto-")).toBe("producto");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("isUuid", () => {
  it("validates UUID v4", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("550e8400-e29b-41d4-a716")).toBe(false);
  });
});

describe("isValidIpAddress", () => {
  it("validates IPv4", () => {
    expect(isValidIpAddress("192.168.1.1")).toBe(true);
  });

  it("rejects invalid IPv4", () => {
    expect(isValidIpAddress("256.1.1.1")).toBe(false);
    expect(isValidIpAddress("invalid")).toBe(false);
  });

  it("validates IPv6", () => {
    expect(isValidIpAddress("::1")).toBe(true);
    expect(isValidIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts x-real-ip", () => {
    const headers = new Headers();
    headers.set("x-real-ip", "192.168.1.100");
    expect(getClientIp(headers)).toBe("192.168.1.100");
  });

  it("falls back to x-forwarded-for", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "10.0.0.1, 10.0.0.2");
    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  it("returns unknown when no headers", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });

  it("validates x-forwarded-for IP", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "invalid-ip");
    expect(getClientIp(headers)).toBe("unknown");
  });
});