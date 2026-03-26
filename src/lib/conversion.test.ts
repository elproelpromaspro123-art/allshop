import { describe, it, expect } from "vitest";

// Test conversion/number utilities
function toNumber(value: string, fallback = 0): number {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function toInteger(value: string, fallback = 0): number {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function safeDivide(a: number, b: number, fallback = 0): number {
  return b !== 0 ? a / b : fallback;
}

function bytesToKb(bytes: number): number {
  return Math.round(bytes / 1024);
}

function bytesToMb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

describe("toNumber", () => {
  it("parses valid numbers", () => {
    expect(toNumber("42.5")).toBe(42.5);
  });

  it("returns fallback for NaN", () => {
    expect(toNumber("abc", 10)).toBe(10);
  });
});

describe("toInteger", () => {
  it("parses integers", () => {
    expect(toInteger("42")).toBe(42);
  });

  it("truncates decimals", () => {
    expect(toInteger("42.9")).toBe(42);
  });
});

describe("safeDivide", () => {
  it("divides normally", () => {
    expect(safeDivide(10, 2)).toBe(5);
  });

  it("returns fallback on division by zero", () => {
    expect(safeDivide(10, 0, -1)).toBe(-1);
  });
});

describe("bytesToKb", () => {
  it("converts bytes to KB", () => {
    expect(bytesToKb(2048)).toBe(2);
  });
});

describe("bytesToMb", () => {
  it("converts bytes to MB", () => {
    expect(bytesToMb(1048576)).toBe(1);
  });
});
