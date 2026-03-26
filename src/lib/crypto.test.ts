import { describe, it, expect } from "vitest";
import {
  generateSecureToken,
  generateId,
  generateSessionId,
  generateIdempotencyKey,
  simpleHash,
  timingSafeEqual,
} from "./crypto";

describe("generateSecureToken", () => {
  it("generates hex string of correct length", () => {
    const token = generateSecureToken(16);
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different tokens", () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
  });
});

describe("generateId", () => {
  it("generates alphanumeric id", () => {
    expect(generateId(10)).toMatch(/^[a-z0-9]{10}$/);
  });

  it("defaults to 8 characters", () => {
    expect(generateId()).toHaveLength(8);
  });
});

describe("generateSessionId", () => {
  it("starts with ses_ prefix", () => {
    expect(generateSessionId()).toMatch(/^ses_[a-z0-9]{24}$/);
  });
});

describe("generateIdempotencyKey", () => {
  it("starts with idk_ prefix", () => {
    expect(generateIdempotencyKey()).toMatch(/^idk_[a-z0-9]{32}$/);
  });

  it("generates unique keys", () => {
    const a = generateIdempotencyKey();
    const b = generateIdempotencyKey();
    expect(a).not.toBe(b);
  });
});

describe("simpleHash", () => {
  it("returns a number", () => {
    expect(typeof simpleHash("test")).toBe("number");
  });

  it("returns same hash for same input", () => {
    expect(simpleHash("hello")).toBe(simpleHash("hello"));
  });

  it("returns different hash for different input", () => {
    expect(simpleHash("hello")).not.toBe(simpleHash("world"));
  });
});

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeEqual("abc", "def")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});
