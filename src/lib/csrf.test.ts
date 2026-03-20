import { describe, it, expect } from "vitest";
import { validateCsrfToken, generateCsrfToken, validateSameOrigin } from "@/lib/csrf";

describe("generateCsrfToken", () => {
  it("generates a non-empty string token", () => {
    const token = generateCsrfToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
  });

  it("generates token with 3 parts separated by dots", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    expect(parts.length).toBe(3);
  });
});

describe("validateCsrfToken", () => {
  it("returns false for null/undefined/empty", () => {
    expect(validateCsrfToken(null)).toBe(false);
    expect(validateCsrfToken(undefined)).toBe(false);
    expect(validateCsrfToken("")).toBe(false);
  });

  it("returns false for invalid format (not 3 parts)", () => {
    expect(validateCsrfToken("invalid")).toBe(false);
    expect(validateCsrfToken("a.b")).toBe(false);
    expect(validateCsrfToken("a.b.c.d")).toBe(false);
  });

  it("returns false for malformed token", () => {
    expect(validateCsrfToken("abc.def.ghi")).toBe(false);
  });

  it("returns true for freshly generated token", () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token)).toBe(true);
  });

  it("returns false for token with invalid signature", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    const tamperedToken = `${parts[0]}.${parts[1]}.invalid_signature_here`;
    expect(validateCsrfToken(tamperedToken)).toBe(false);
  });
});

describe("validateSameOrigin", () => {
  it("returns false when host header is missing", () => {
    const request = new Request("http://localhost/", {
      method: "POST",
    });
    expect(validateSameOrigin(request)).toBe(false);
  });

  it("returns true when origin matches host (development)", () => {
    const request = new Request("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
    });
    expect(validateSameOrigin(request)).toBe(true);
  });

  it("returns false when origin does not match host", () => {
    const request = new Request("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        origin: "http://evil.com",
        host: "localhost:3000",
      },
    });
    expect(validateSameOrigin(request)).toBe(false);
  });

  it("returns true when origin is not set but Referer matches", () => {
    const request = new Request("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        referer: "http://localhost:3000/page",
        host: "localhost:3000",
      },
    });
    expect(validateSameOrigin(request)).toBe(true);
  });
});