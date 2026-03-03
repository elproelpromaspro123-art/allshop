import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://allshop.co";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/checkout/", "/orden/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
