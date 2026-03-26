import { describe, it, expect } from "vitest";

// Test the phone normalization behavior
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return `+57${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+${digits}`;
  }
  if (digits.length === 13 && digits.startsWith("57")) {
    return `+${digits}`;
  }
  return phone;
}

function isValidColombianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  const clean = digits.startsWith("57") ? digits.slice(2) : digits;
  return clean.length === 10 && /^[3]/.test(clean);
}

describe("normalizePhone", () => {
  it("adds country code to 10-digit phone", () => {
    expect(normalizePhone("3001234567")).toBe("+573001234567");
  });

  it("handles phone with country code", () => {
    expect(normalizePhone("573001234567")).toBe("+573001234567");
  });

  it("handles formatted phone", () => {
    expect(normalizePhone("(300) 123-4567")).toBe("+573001234567");
  });
});

describe("isValidColombianPhone", () => {
  it("validates 10-digit phone starting with 3", () => {
    expect(isValidColombianPhone("3001234567")).toBe(true);
  });

  it("validates phone with country code", () => {
    expect(isValidColombianPhone("573001234567")).toBe(true);
  });

  it("rejects phone starting with 1", () => {
    expect(isValidColombianPhone("1001234567")).toBe(false);
  });

  it("rejects short phone", () => {
    expect(isValidColombianPhone("300123")).toBe(false);
  });
});
