import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/checkout",
          "/api/webhooks",
          "/api/admin",
          "/api/internal",
          "/favoritos",
          "/checkout",
          "/orden",
          "/admin",
          "/panel-privado",
          "/bloqueado",
          "/offline.html",
        ],
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
