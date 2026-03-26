import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/db";

const STATIC_PAGES_LAST_MODIFIED = new Date("2026-03-01T00:00:00Z");

function toValidDate(value: string | null | undefined, fallback: Date) {
  const candidate = value ? new Date(value) : fallback;
  return Number.isNaN(candidate.getTime()) ? fallback : candidate;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const staticPaths = [
    "/faq",
    "/envios",
    "/devoluciones",
    "/seguimiento",
    "/soporte",
    "/terminos",
    "/privacidad",
    "/cookies",
  ];

  // Static pages use a recent date to encourage crawling since
  // Google Search Console is skipping them.
  const staticUrls: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: STATIC_PAGES_LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: toValidDate(cat.created_at, STATIC_PAGES_LAST_MODIFIED),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/producto/${product.slug}`,
    lastModified: toValidDate(product.updated_at, STATIC_PAGES_LAST_MODIFIED),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const latestProductDate = products.reduce((latest, product) => {
    const candidate = toValidDate(product.updated_at, STATIC_PAGES_LAST_MODIFIED);
    return candidate.getTime() > latest.getTime() ? candidate : latest;
  }, STATIC_PAGES_LAST_MODIFIED);

  return [
    {
      url: baseUrl,
      lastModified: latestProductDate,
      changeFrequency: "daily",
      priority: 1,
    },
    ...staticUrls,
    ...categoryUrls,
    ...productUrls,
  ];
}
