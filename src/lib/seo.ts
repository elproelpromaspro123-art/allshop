import type { Product } from "@/types";

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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vortixy",
    url: "https://vortixy.co",
    logo: "https://vortixy.co/android-chrome-512x512.png",
    sameAs: [
      "https://instagram.com/vortixy_oficial",
      "https://facebook.com/vortixy"
    ]
  };
}
