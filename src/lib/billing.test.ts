import { describe, it, expect } from "vitest";

// Test billing/invoice-related utilities
function generateInvoiceNumber(sequence: number, year = new Date().getFullYear()): string {
  const padded = String(sequence).padStart(6, "0");
  return `FV-${year}-${padded}`;
}

function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateTax(subtotal: number, taxRate = 0.19): number {
  return Math.round(subtotal * taxRate);
}

function calculateTotal(subtotal: number, tax: number, shipping = 0, discount = 0): number {
  return Math.max(0, subtotal + tax + shipping - discount);
}

describe("generateInvoiceNumber", () => {
  it("generates correct format", () => {
    expect(generateInvoiceNumber(1, 2026)).toBe("FV-2026-000001");
  });

  it("pads sequence numbers", () => {
    expect(generateInvoiceNumber(42, 2026)).toBe("FV-2026-000042");
  });
});

describe("calculateSubtotal", () => {
  it("sums items correctly", () => {
    const items = [
      { price: 10000, quantity: 2 },
      { price: 25000, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(45000);
  });

  it("returns 0 for empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe("calculateTax", () => {
  it("calculates 19% IVA", () => {
    expect(calculateTax(100000)).toBe(19000);
  });

  it("rounds to nearest integer", () => {
    expect(calculateTax(100)).toBe(19);
  });
});

describe("calculateTotal", () => {
  it("sums all components", () => {
    expect(calculateTotal(100000, 19000, 10000, 5000)).toBe(124000);
  });

  it("does not go below 0", () => {
    expect(calculateTotal(0, 0, 0, 100)).toBe(0);
  });
});
