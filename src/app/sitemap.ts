import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/db";

// We use a recent date to encourage Google to re-crawl static pages
// that are currently listed as "Discovered - currently not indexed"
const STATIC_PAGES_LAST_MODIFIED = new Date();

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

  // Static pages use a recent date to encourage crawling since
  // Google Search Console is skipping them.
  const staticUrls: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: STATIC_PAGES_LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 0.8,
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
