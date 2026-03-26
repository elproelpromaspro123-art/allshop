import { describe, it, expect } from "vitest";

// Test product stock and pricing utilities
function isLowStock(stock: number, threshold = 5): boolean {
  return stock > 0 && stock <= threshold;
}

function isOutOfStock(stock: number): boolean {
  return stock <= 0;
}

function getStockStatus(stock: number, lowThreshold = 5): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowThreshold) return "low_stock";
  return "in_stock";
}

function getStockBadgeText(stock: number): string {
  if (stock <= 0) return "Agotado";
  if (stock <= 3) return "¡Últimas unidades!";
  if (stock <= 10) return "Poco stock";
  return "";
}

function formatStockIndicator(stock: number): { color: string; percentage: number } {
  if (stock <= 0) return { color: "red", percentage: 0 };
  if (stock <= 5) return { color: "amber", percentage: (stock / 20) * 100 };
  return { color: "green", percentage: Math.min(100, (stock / 50) * 100) };
}

describe("isLowStock", () => {
  it("returns true when stock is between 1 and threshold", () => {
    expect(isLowStock(3, 5)).toBe(true);
  });

  it("returns false when stock is above threshold", () => {
    expect(isLowStock(10, 5)).toBe(false);
  });

  it("returns false when stock is 0", () => {
    expect(isLowStock(0, 5)).toBe(false);
  });
});

describe("isOutOfStock", () => {
  it("returns true for 0 stock", () => {
    expect(isOutOfStock(0)).toBe(true);
  });

  it("returns true for negative stock", () => {
    expect(isOutOfStock(-1)).toBe(true);
  });

  it("returns false for positive stock", () => {
    expect(isOutOfStock(5)).toBe(false);
  });
});

describe("getStockStatus", () => {
  it("returns in_stock for high stock", () => {
    expect(getStockStatus(20)).toBe("in_stock");
  });

  it("returns low_stock for low stock", () => {
    expect(getStockStatus(3)).toBe("low_stock");
  });

  it("returns out_of_stock for zero", () => {
    expect(getStockStatus(0)).toBe("out_of_stock");
  });
});

describe("getStockBadgeText", () => {
  it("returns empty for high stock", () => {
    expect(getStockBadgeText(50)).toBe("");
  });

  it("returns last units for very low stock", () => {
    expect(getStockBadgeText(2)).toBe("¡Últimas unidades!");
  });

  it("returns out of stock text", () => {
    expect(getStockBadgeText(0)).toBe("Agotado");
  });
});

describe("formatStockIndicator", () => {
  it("returns red for out of stock", () => {
    const result = formatStockIndicator(0);
    expect(result.color).toBe("red");
    expect(result.percentage).toBe(0);
  });

  it("returns amber for low stock", () => {
    const result = formatStockIndicator(3);
    expect(result.color).toBe("amber");
  });

  it("returns green for good stock", () => {
    const result = formatStockIndicator(30);
    expect(result.color).toBe("green");
  });
});
