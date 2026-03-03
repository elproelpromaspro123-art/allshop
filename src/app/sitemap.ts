import type { MetadataRoute } from "next";
import { CATEGORIES, PRODUCTS } from "@/data/mock";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://allshop.co";

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = PRODUCTS.filter((p) => p.is_active).map(
    (product) => ({
      url: `${baseUrl}/producto/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
