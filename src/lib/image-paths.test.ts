import { describe, it, expect } from "vitest";

// Test image path utilities
function normalizeImagePath(path: string): string {
  if (!path) return "";
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
}

function isExternalUrl(path: string): boolean {
  return /^https?:\/\//.test(path);
}

function getImageDimensions(path: string): { width?: number; height?: number } {
  const match = path.match(/(\d+)x(\d+)/);
  if (match) {
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
  }
  return {};
}

function getProductImagePath(slug: string, index = 0): string {
  return `/productos/${slug}/${index}.webp`;
}

describe("normalizeImagePath", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizeImagePath("images\\product.jpg")).toBe("images/product.jpg");
  });

  it("removes duplicate slashes", () => {
    expect(normalizeImagePath("images//product.jpg")).toBe("images/product.jpg");
  });

  it("trims whitespace", () => {
    expect(normalizeImagePath(" images/product.jpg ")).toBe("images/product.jpg");
  });

  it("returns empty for empty input", () => {
    expect(normalizeImagePath("")).toBe("");
  });
});

describe("isExternalUrl", () => {
  it("detects http URLs", () => {
    expect(isExternalUrl("http://example.com/img.jpg")).toBe(true);
  });

  it("detects https URLs", () => {
    expect(isExternalUrl("https://example.com/img.jpg")).toBe(true);
  });

  it("returns false for local paths", () => {
    expect(isExternalUrl("/images/product.jpg")).toBe(false);
  });
});

describe("getImageDimensions", () => {
  it("extracts dimensions from filename", () => {
    expect(getImageDimensions("image-800x600.jpg")).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("returns empty for no dimensions", () => {
    expect(getImageDimensions("product.jpg")).toEqual({});
  });
});

describe("getProductImagePath", () => {
  it("returns correct path for index 0", () => {
    expect(getProductImagePath("airpods-pro")).toBe("/productos/airpods-pro/0.webp");
  });

  it("handles different indices", () => {
    expect(getProductImagePath("airpods-pro", 2)).toBe("/productos/airpods-pro/2.webp");
  });
});
