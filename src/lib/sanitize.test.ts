import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "./sanitize";

describe("sanitizeText", () => {
  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });
  it("collapses multiple spaces", () => {
    expect(sanitizeText("hello   world")).toBe("hello world");
  });
  it("strips control characters", () => {
    expect(sanitizeText("hello\x00world")).toBe("helloworld");
  });
  it("strips zero-width spaces", () => {
    expect(sanitizeText("hello\u200Bworld")).toBe("helloworld");
  });
  it("truncates to maxLength", () => {
    expect(sanitizeText("a".repeat(300), 10)).toBe("a".repeat(10));
  });
  it("handles empty input", () => {
    expect(sanitizeText("")).toBe("");
  });
  it("handles null-like input", () => {
    expect(sanitizeText(null as unknown as string)).toBe("");
  });
  it("normalizes Unicode NFKC", () => {
    expect(sanitizeText("ﬁ")).toBe("fi");
  });
});

describe("sanitizeEmail", () => {
  it("lowercases email", () => {
    expect(sanitizeEmail("User@Example.COM")).toBe("user@example.com");
  });
  it("trims spaces", () => {
    expect(sanitizeEmail("  user@test.com  ")).toBe("user@test.com");
  });
});

describe("sanitizePhone", () => {
  it("keeps only digits", () => {
    expect(sanitizePhone("310-555-7890")).toBe("3105557890");
  });
  it("preserves leading +", () => {
    expect(sanitizePhone("+57 310 555")).toBe("+57310555");
  });
  it("handles empty", () => {
    expect(sanitizePhone("")).toBe("");
  });
});
