import { describe, it, expect } from "vitest";

function generateShortId(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function generateOrderId(): string {
  const prefix = "VRT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateShortId(6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

describe("generateShortId", () => {
  it("generates id of correct length", () => {
    expect(generateShortId(8)).toHaveLength(8);
  });

  it("generates alphanumeric only", () => {
    expect(generateShortId(20)).toMatch(/^[a-z0-9]+$/);
  });

  it("generates different ids", () => {
    const a = generateShortId();
    const b = generateShortId();
    expect(a).not.toBe(b);
  });
});

describe("generateOrderId", () => {
  it("starts with VRT prefix", () => {
    expect(generateOrderId()).toMatch(/^VRT-/);
  });

  it("has correct format", () => {
    expect(generateOrderId()).toMatch(/^VRT-[A-Z0-9]+-[A-Z0-9]{6}$/);
  });

  it("generates unique ids", () => {
    const a = generateOrderId();
    const b = generateOrderId();
    expect(a).not.toBe(b);
  });
});
