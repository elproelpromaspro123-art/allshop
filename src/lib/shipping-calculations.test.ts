import { describe, it, expect } from "vitest";

// Test shipping calculation utilities
function calculateShippingByWeight(weightGrams: number): number {
  if (weightGrams <= 500) return 8000;
  if (weightGrams <= 1000) return 12000;
  if (weightGrams <= 2000) return 18000;
  return 25000;
}

function isFreeShippingEligible(subtotal: number, threshold = 150000): boolean {
  return subtotal >= threshold;
}

function estimateDeliveryDays(
  department: string,
  isCapital: boolean,
): { min: number; max: number } {
  if (isCapital) {
    return department === "Bogotá D.C." ? { min: 1, max: 2 } : { min: 2, max: 4 };
  }
  return { min: 3, max: 7 };
}

function formatDeliveryRange(minDays: number, maxDays: number): string {
  if (minDays === maxDays) {
    return `${minDays} día${minDays !== 1 ? "s" : ""}`;
  }
  return `${minDays} a ${maxDays} días hábiles`;
}

describe("calculateShippingByWeight", () => {
  it("charges 8000 for light items", () => {
    expect(calculateShippingByWeight(300)).toBe(8000);
  });

  it("charges more for heavy items", () => {
    expect(calculateShippingByWeight(3000)).toBe(25000);
  });

  it("charges 12000 for mid-weight", () => {
    expect(calculateShippingByWeight(700)).toBe(12000);
  });
});

describe("isFreeShippingEligible", () => {
  it("returns true at threshold", () => {
    expect(isFreeShippingEligible(150000)).toBe(true);
  });

  it("returns true above threshold", () => {
    expect(isFreeShippingEligible(200000)).toBe(true);
  });

  it("returns false below threshold", () => {
    expect(isFreeShippingEligible(100000)).toBe(false);
  });

  it("supports custom threshold", () => {
    expect(isFreeShippingEligible(50000, 50000)).toBe(true);
  });
});

describe("estimateDeliveryDays", () => {
  it("returns 1-2 days for Bogotá capital", () => {
    const result = estimateDeliveryDays("Bogotá D.C.", true);
    expect(result).toEqual({ min: 1, max: 2 });
  });

  it("returns 2-4 for other capitals", () => {
    const result = estimateDeliveryDays("Antioquía", true);
    expect(result).toEqual({ min: 2, max: 4 });
  });

  it("returns 3-7 for non-capital", () => {
    const result = estimateDeliveryDays("Antioquía", false);
    expect(result).toEqual({ min: 3, max: 7 });
  });
});

describe("formatDeliveryRange", () => {
  it("formats same min/max as singular", () => {
    expect(formatDeliveryRange(1, 1)).toBe("1 día");
  });

  it("formats range", () => {
    expect(formatDeliveryRange(2, 4)).toBe("2 a 4 días hábiles");
  });
});
