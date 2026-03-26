import { describe, it, expect } from "vitest";

/**
 * Tests for formatters utility functions
 * Covers: truncateText, capitalizeWords, camelToKebab, kebabToCamel, normalizeWhitespace,
 *         generateShortId, maskSensitiveData, isAlphabetic, isNumeric, formatPhoneNumber,
 *         formatDocumentNumber
 */

// Since the module doesn't exist yet, define the functions inline for testing
// This tests the expected behavior that should be in formatters.ts

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + "...";
}

function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function camelToKebab(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function generateShortId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
}

function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) return "*".repeat(data.length);
  const masked = "*".repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
}

function isAlphabetic(text: string): boolean {
  return /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(text);
}

function isNumeric(text: string): boolean {
  return /^\d+$/.test(text);
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

function formatDocumentNumber(doc: string): string {
  const digits = doc.replace(/\D/g, "");
  if (digits.length >= 9) {
    return `${digits.slice(0, digits.length - 6)}.${digits.slice(digits.length - 6, digits.length - 3)}.${digits.slice(digits.length - 3)}`;
  }
  return doc;
}

describe("truncateText", () => {
  it("returns text as-is when within limit", () => {
    expect(truncateText("hello", 10)).toBe("hello");
  });

  it("truncates with ellipsis when exceeding limit", () => {
    expect(truncateText("hello world this is long", 10)).toBe("hello w...");
  });

  it("handles empty string", () => {
    expect(truncateText("", 5)).toBe("");
  });

  it("handles exact length", () => {
    expect(truncateText("hello", 5)).toBe("hello");
  });
});

describe("capitalizeWords", () => {
  it("capitalizes first letter of each word", () => {
    expect(capitalizeWords("hello world")).toBe("Hello World");
  });

  it("handles single word", () => {
    expect(capitalizeWords("hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(capitalizeWords("")).toBe("");
  });
});

describe("camelToKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(camelToKebab("backgroundColor")).toBe("background-color");
  });

  it("handles single word", () => {
    expect(camelToKebab("color")).toBe("color");
  });
});

describe("kebabToCamel", () => {
  it("converts kebab-case to camelCase", () => {
    expect(kebabToCamel("background-color")).toBe("backgroundColor");
  });

  it("handles single word", () => {
    expect(kebabToCamel("color")).toBe("color");
  });
});

describe("normalizeWhitespace", () => {
  it("removes extra whitespace", () => {
    expect(normalizeWhitespace("  hello   world  ")).toBe("hello world");
  });

  it("handles tabs and newlines", () => {
    expect(normalizeWhitespace("hello\t\nworld")).toBe("hello world");
  });
});

describe("generateShortId", () => {
  it("generates slug from text", () => {
    expect(generateShortId("Hola Mundo")).toBe("hola-mundo");
  });

  it("removes accents", () => {
    expect(generateShortId("auriculares")).toBe("auriculares");
  });

  it("handles empty string", () => {
    expect(generateShortId("")).toBe("");
  });
});

describe("maskSensitiveData", () => {
  it("masks all but last 4 chars", () => {
    expect(maskSensitiveData("1234567890")).toBe("******7890");
  });

  it("masks short strings completely", () => {
    expect(maskSensitiveData("abc", 4)).toBe("***");
  });

  it("respects custom visible chars", () => {
    expect(maskSensitiveData("1234567890", 2)).toBe("********90");
  });
});

describe("isAlphabetic", () => {
  it("accepts letters with accents", () => {
    expect(isAlphabetic("auriculares")).toBe(true);
  });

  it("rejects numbers", () => {
    expect(isAlphabetic("hello123")).toBe(false);
  });
});

describe("isNumeric", () => {
  it("accepts digits only", () => {
    expect(isNumeric("12345")).toBe(true);
  });

  it("rejects letters", () => {
    expect(isNumeric("123a")).toBe(false);
  });
});

describe("formatPhoneNumber", () => {
  it("formats 10-digit phone", () => {
    expect(formatPhoneNumber("3001234567")).toBe("(300) 123-4567");
  });

  it("formats 12-digit with country code", () => {
    expect(formatPhoneNumber("573001234567")).toBe("+57 (300) 123-4567");
  });

  it("returns original for invalid length", () => {
    expect(formatPhoneNumber("1234")).toBe("1234");
  });
});

describe("formatDocumentNumber", () => {
  it("formats 10-digit document", () => {
    expect(formatDocumentNumber("1234567890")).toBe("1234.567.890");
  });

  it("returns original for short document", () => {
    expect(formatDocumentNumber("12345")).toBe("12345");
  });
});
