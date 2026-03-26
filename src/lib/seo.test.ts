import { describe, expect, it } from "vitest";
import {
  buildStaticPageBreadcrumbs,
  buildStaticPageMetadata,
  generateBreadcrumbJsonLd,
  generateContactPageJsonLd,
  generateFaqPageJsonLd,
} from "@/lib/seo";

describe("seo helpers", () => {
  it("builds static page metadata with canonical, robots and social cards", () => {
    const metadata = buildStaticPageMetadata({
      title: "Soporte",
      description: "Canales oficiales para soporte.",
      path: "/soporte",
      index: false,
      openGraphType: "article",
    });
    const openGraph = metadata.openGraph as { type?: string } | undefined;
    const twitter = metadata.twitter as { card?: string } | undefined;

    expect(metadata.alternates?.canonical).toBe("/soporte");
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(openGraph?.type).toBe("article");
    expect(twitter?.card).toBe("summary_large_image");
  });

  it("builds breadcrumbs without duplicating the help section root", () => {
    expect(
      buildStaticPageBreadcrumbs({
        title: "Preguntas frecuentes",
        path: "/faq",
        type: "help",
      }),
    ).toEqual([
      { name: "Inicio", path: "/" },
      { name: "Preguntas frecuentes", path: "/faq" },
    ]);

    expect(
      buildStaticPageBreadcrumbs({
        title: "Soporte",
        path: "/soporte",
        type: "help",
      }),
    ).toEqual([
      { name: "Inicio", path: "/" },
      { name: "Ayuda", path: "/faq" },
      { name: "Soporte", path: "/soporte" },
    ]);
  });

  it("generates absolute breadcrumb json-ld entries", () => {
    const jsonLd = generateBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Cookies", path: "/cookies" },
    ]);

    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://vortixy.net/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cookies",
        item: "https://vortixy.net/cookies",
      },
    ]);
  });

  it("generates faq page structured data with questions", () => {
    const jsonLd = generateFaqPageJsonLd({
      title: "FAQ",
      description: "Preguntas frecuentes",
      path: "/faq",
      entries: [
        {
          question: "¿Cómo pago?",
          answer: "Pagas contra entrega.",
        },
      ],
    });

    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(1);
    expect(jsonLd.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "¿Cómo pago?",
    });
  });

  it("generates contact page structured data with support channels", () => {
    const jsonLd = generateContactPageJsonLd({
      title: "Soporte",
      description: "Habla con Vortixy",
      path: "/soporte",
    });

    expect(jsonLd["@type"]).toBe("ContactPage");
    expect(jsonLd.contactPoint).toMatchObject({
      "@type": "ContactPoint",
      contactType: "customer support",
      areaServed: "CO",
    });
  });
});
