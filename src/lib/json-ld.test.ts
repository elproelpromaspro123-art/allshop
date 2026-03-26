import { describe, it, expect } from "vitest";
import { safeJsonLd } from "./json-ld";

describe("safeJsonLd", () => {
  it("stringifies object", () => {
    const result = safeJsonLd({ foo: "bar" });
    expect(result).toBe('{"foo":"bar"}');
  });

  it("escapes less-than sign", () => {
    const result = safeJsonLd({ text: "<script>" });
    expect(result).not.toContain("<script>");
    expect(result).toContain("\\u003cscript\\u003e");
  });

  it("escapes greater-than sign", () => {
    const result = safeJsonLd({ text: "a > b" });
    expect(result).not.toContain("a > b");
    expect(result).toContain("a \\u003e b");
  });

  it("escapes ampersand", () => {
    const result = safeJsonLd({ text: "foo & bar" });
    expect(result).not.toContain("foo & bar");
    expect(result).toContain("foo \\u0026 bar");
  });

  it("escapes line separators", () => {
    const result = safeJsonLd({ text: "line1\u2028line2" });
    expect(result).toContain("\\u2028");
  });

  it("escapes paragraph separators", () => {
    const result = safeJsonLd({ text: "line1\u2029line2" });
    expect(result).toContain("\\u2029");
  });

  it("handles arrays", () => {
    const result = safeJsonLd([{ name: "Test" }, { name: "Test2" }]);
    expect(result).toBe('[{"name":"Test"},{"name":"Test2"}]');
  });

  it("handles nested objects", () => {
    const result = safeJsonLd({
      organization: {
        name: "Vortixy",
        contact: { email: "test@example.com" }
      }
    });
    expect(result).toContain("organization");
    expect(result).toContain("Vortixy");
  });

  it("escapes HTML special characters in payloads", () => {
    const malicious = {
      text: '<img src=x onerror="alert(1)">',
      text2: "<svg onload=alert(1)>",
      text3: "a > b && c < d"
    };
    const result = safeJsonLd(malicious);
    // Escapes < > & characters
    expect(result).toContain("\\u003cimg");
    expect(result).toContain("\\u003csvg");
    expect(result).toContain("\\u003e");
    expect(result).toContain("\\u0026");
  });
});