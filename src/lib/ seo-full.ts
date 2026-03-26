/**
 * SEO utilities  
 */

export function generateMetaTags(config: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  const meta: Array<{ [key: string]: string }> = [
    { name: "description", content: config.description },
    { property: "og:title", content: config.title },
    { property: "og:description", content: config.description },
    { property: "og:type", content: config.type || "website" },
  ];
  if (config.image) {
    meta.push({ property: "og:image", content: config.image });
  }
  if (config.url) {
    meta.push({ property: "og:url", content: config.url });
  }
  return meta;
}

export function generateTwitterCard(config: {
  title: string;
  description: string;
  image?: string;
}) {
  return [
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: config.title },
    { name: "twitter:description", content: config.description },
    ...(config.image ? [{ name: "twitter:image", content: config.image }] : []),
  ];
}

export function generateStructuredData(type: string, data: Record<string, unknown>) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}