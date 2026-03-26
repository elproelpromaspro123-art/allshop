import type { Metadata } from "next";
import type { Product } from "@/types";
import { SUPPORT_EMAIL, WHATSAPP_PHONE, getBaseUrl, toAbsoluteUrl } from "@/lib/site";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface StaticPageMetadataInput {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  openGraphType?: "website" | "article";
}

interface StaticPageBreadcrumbInput {
  title: string;
  path: string;
  type?: "default" | "help" | "legal";
}

interface WebPageJsonLdInput {
  title: string;
  description: string;
  path: string;
  type?: "WebPage" | "CollectionPage" | "ContactPage" | "FAQPage";
}

interface FaqEntry {
  question: string;
  answer: string;
}

export function buildStaticPageMetadata({
  title,
  description,
  path,
  index = true,
  openGraphType = "website",
}: StaticPageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index,
      follow: index,
    },
    openGraph: {
      title,
      description,
      type: openGraphType,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildStaticPageBreadcrumbs({
  title,
  path,
  type = "default",
}: StaticPageBreadcrumbInput): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ name: "Inicio", path: "/" }];

  const sections: Record<Exclude<StaticPageBreadcrumbInput["type"], undefined>, BreadcrumbItem | null> = {
    default: null,
    help: { name: "Ayuda", path: "/faq" },
    legal: { name: "Legal", path: "/terminos" },
  };

  const section = sections[type];
  if (section && section.path !== path) {
    items.push(section);
  }

  items.push({
    name: title,
    path,
  });

  return items;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function generateWebPageJsonLd({
  title,
  description,
  path,
  type = "WebPage",
}: WebPageJsonLdInput) {
  const absoluteUrl = toAbsoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: absoluteUrl,
    inLanguage: "es-CO",
    isPartOf: {
      "@type": "WebSite",
      name: "Vortixy",
      url: getBaseUrl(),
    },
  };
}

export function generateContactPageJsonLd(input: Omit<WebPageJsonLdInput, "type">) {
  return {
    ...generateWebPageJsonLd({
      ...input,
      type: "ContactPage",
    }),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      telephone: `+${WHATSAPP_PHONE}`,
      areaServed: "CO",
      availableLanguage: ["es"],
    },
  };
}

export function generateFaqPageJsonLd({
  title,
  description,
  path,
  entries,
}: Omit<WebPageJsonLdInput, "type"> & { entries: FaqEntry[] }) {
  return {
    ...generateWebPageJsonLd({
      title,
      description,
      path,
      type: "FAQPage",
    }),
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function generateProductJsonLd(product: Product, currentUrl: string) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description?.substring(0, 160) || `Comprar ${product.name} en Vortixy.`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Vortixy",
    },
    offers: {
      "@type": "Offer",
      url: currentUrl,
      priceCurrency: "COP",
      price: product.price,
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.average_rating && product.reviews_count ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.average_rating,
        reviewCount: product.reviews_count,
      }
    } : {})
  };
}

export function generateOrganizationJsonLd() {
  const siteUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vortixy",
    url: siteUrl,
    logo: toAbsoluteUrl("/android-chrome-512x512.png"),
    sameAs: [
      "https://instagram.com/vortixy_oficial",
      "https://facebook.com/vortixy"
    ]
  };
}
