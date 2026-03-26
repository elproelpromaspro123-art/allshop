import { describe, it, expect } from "vitest";

// Test URL building utilities
function buildProductUrl(slug: string): string {
  return `/producto/${slug}`;
}

function buildCategoryUrl(slug: string): string {
  return `/categoria/${slug}`;
}

function buildOrderTrackingUrl(paymentId: string): string {
  return `/seguimiento?orden=${paymentId}`;
}

function buildShareUrl(platform: string, url: string, text?: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = text ? encodeURIComponent(text) : "";
  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    default:
      return url;
  }
}

function buildDeepLink(path: string, baseUrl = "https://vortixy.net"): string {
  return `${baseUrl}${path}`;
}

describe("buildProductUrl", () => {
  it("generates correct product URL", () => {
    expect(buildProductUrl("airpods-pro")).toBe("/producto/airpods-pro");
  });
});

describe("buildCategoryUrl", () => {
  it("generates correct category URL", () => {
    expect(buildCategoryUrl("audio")).toBe("/categoria/audio");
  });
});

describe("buildOrderTrackingUrl", () => {
  it("generates tracking URL with payment ID", () => {
    expect(buildOrderTrackingUrl("VRT-ABC123")).toBe("/seguimiento?orden=VRT-ABC123");
  });
});

describe("buildShareUrl", () => {
  it("generates WhatsApp share URL", () => {
    const url = buildShareUrl("whatsapp", "https://vortixy.net/p/test", "Mira esto");
    expect(url).toContain("wa.me");
    expect(url).toContain("vortixy");
  });

  it("generates Facebook share URL", () => {
    const url = buildShareUrl("facebook", "https://vortixy.net/p/test");
    expect(url).toContain("facebook.com/sharer");
  });

  it("returns original URL for unknown platform", () => {
    expect(buildShareUrl("unknown", "https://test.com")).toBe("https://test.com");
  });
});

describe("buildDeepLink", () => {
  it("builds full URL from path", () => {
    expect(buildDeepLink("/producto/test")).toBe("https://vortixy.net/producto/test");
  });

  it("uses custom base URL", () => {
    expect(buildDeepLink("/test", "https://example.com")).toBe("https://example.com/test");
  });
});
