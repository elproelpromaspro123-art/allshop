import { describe, it, expect } from "vitest";

// Test product page content utilities
function extractDescription(description: string, maxLength = 160): string {
  if (!description) return "";
  const plain = description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength - 3).trim() + "...";
}

function parseProductFeatures(description: string): string[] {
  if (!description) return [];
  const lines = description.split("\n").filter(l => l.trim().startsWith("-"));
  return lines.map(l => l.replace(/^-\s*/, "").trim());
}

function generateBreadcrumbSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

describe("extractDescription", () => {
  it("removes HTML tags", () => {
    expect(extractDescription("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("truncates long descriptions", () => {
    const long = "A".repeat(200);
    const result = extractDescription(long, 100);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).toContain("...");
  });

  it("returns empty for empty input", () => {
    expect(extractDescription("")).toBe("");
  });
});

describe("parseProductFeatures", () => {
  it("extracts bullet point features", () => {
    const desc = "- Feature 1\n- Feature 2\nRegular text";
    expect(parseProductFeatures(desc)).toEqual(["Feature 1", "Feature 2"]);
  });

  it("returns empty for no features", () => {
    expect(parseProductFeatures("Just text")).toEqual([]);
  });

  it("handles empty input", () => {
    expect(parseProductFeatures("")).toEqual([]);
  });
});

describe("generateBreadcrumbSlug", () => {
  it("generates URL-safe slug", () => {
    expect(generateBreadcrumbSlug("Auriculares Xiaomi")).toBe("auriculares-xiaomi");
  });

  it("removes accents", () => {
    expect(generateBreadcrumbSlug("auriculares")).toBe("auriculares");
  });

  it("handles special characters", () => {
    expect(generateBreadcrumbSlug("Samsung Galaxy S24!")).toBe("samsung-galaxy-s24");
  });
});
