import { describe, it, expect } from "vitest";

// Test schema/metadata utilities
function buildProductJsonLd(product: {
  name: string;
  price: number;
  image?: string;
  slug: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image || "",
    description: product.description || "",
    url: `https://vortixy.net/producto/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "COP",
      availability: "https://schema.org/InStock",
    },
  };
}

function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

describe("buildProductJsonLd", () => {
  it("generates valid Product schema", () => {
    const result = buildProductJsonLd({
      name: "Auriculares Xiaomi",
      price: 45000,
      slug: "auriculares-xiaomi",
    });
    expect(result["@type"]).toBe("Product");
    expect(result.offers.price).toBe(45000);
    expect(result.offers.priceCurrency).toBe("COP");
  });

  it("includes product URL", () => {
    const result = buildProductJsonLd({
      name: "Test",
      price: 100,
      slug: "test",
    });
    expect(result.url).toContain("/producto/test");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("generates valid BreadcrumbList", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Inicio", url: "https://vortixy.net" },
      { name: "Audio", url: "https://vortixy.net/categoria/audio" },
    ]);
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
  });
});

describe("buildFaqJsonLd", () => {
  it("generates valid FAQPage", () => {
    const result = buildFaqJsonLd([
      { question: "¿Cómo compro?", answer: "Agrega al carrito y confirma." },
    ]);
    expect(result["@type"]).toBe("FAQPage");
    expect(result.mainEntity[0].name).toBe("¿Cómo compro?");
  });
});
