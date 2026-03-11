import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/db";

// Fixed date for static pages that rarely change (fix 4.3)
const STATIC_PAGES_LAST_MODIFIED = new Date("2026-03-01T00:00:00Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
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

  // Static pages use a fixed date instead of new Date() to avoid
  // appearing "freshly changed" on every sitemap generation (fix 4.3)
  const staticUrls: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: STATIC_PAGES_LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Categories use created_at from the database instead of new Date() (fix 4.3)
  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(cat.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/producto/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: products.length > 0
        ? new Date(Math.max(...products.map(p => new Date(p.updated_at).getTime())))
        : STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 1,
    },
    ...staticUrls,
    ...categoryUrls,
    ...productUrls,
  ];
}
