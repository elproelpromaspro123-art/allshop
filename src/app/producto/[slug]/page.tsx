import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getProductSlugs,
  getProductsByCategory,
  getCategories,
  getVerifiedReviewsByProductId,
} from "@/lib/db";
import { getProductPageContent } from "@/lib/product-page-content";
import { toAbsoluteUrl } from "@/lib/site";
import { getServerT } from "@/lib/i18n";
import { getProductSlugLookupCandidates } from "@/lib/legacy-product-slugs";
import { ProductPageClient } from "./ProductPageClient";

export const revalidate = 60;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const canonicalSlugs = await getProductSlugs();
  const allSlugs = new Set<string>();

  canonicalSlugs.forEach((slug) => {
    getProductSlugLookupCandidates(slug).forEach((candidate) => {
      allSlugs.add(candidate);
    });
  });

  return Array.from(allSlugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getServerT();
  const ogLocale = "es_CO";
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: t("notFound.title"),
      description: t("notFound.subtitle"),
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  const categories = await getCategories();
  const category = categories.find((c) => c.id === product.category_id);
  const canonicalPath = `/producto/${product.slug}`;
  const title = product.meta_title || t("product.metaTitle", { name: product.name });
  const description =
    product.meta_description ||
    t("product.metaDescription", {
      description: product.description.slice(0, 160),
    });
  const ogImageUrl = toAbsoluteUrl(`${canonicalPath}/opengraph-image`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "Vortixy",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "COP",
      "product:availability": "in stock",
      "product:category": category?.name || "",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  if (slug !== product.slug) {
    redirect(`/producto/${product.slug}`);
  }

  const categories = await getCategories();
  const category = categories.find((c) => c.id === product.category_id) ?? null;

  const productPath = `/producto/${product.slug}`;
  const productUrl = toAbsoluteUrl(productPath);

  const categoryProducts = await getProductsByCategory(product.category_id);
  const relatedProducts = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  const reviews = await getVerifiedReviewsByProductId(product.id);
  const pageContent = getProductPageContent(product.slug);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Math.min(5, Math.max(1, r.rating)), 0) / reviews.length
      : null;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => toAbsoluteUrl(img)),
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Vortixy",
    },
    category: category?.name || undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "COP",
      price: String(product.price),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Vortixy",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "CO",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 7,
            unitCode: "d",
          },
        },
      },
    },
  };

  if (averageRating !== null && reviews.length > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      reviewCount: String(reviews.length),
    };
    productSchema.review = reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.reviewer_name,
      },
      datePublished: review.created_at.split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(review.rating),
        bestRating: "5",
      },
      reviewBody: review.body || review.title,
    }));
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: toAbsoluteUrl("/"),
      },
      ...(category
        ? [
          {
            "@type": "ListItem",
            position: 2,
            name: category.name,
            item: toAbsoluteUrl(`/categoria/${category.slug}`),
          },
        ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 3 : 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };



  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
      />
      <ProductPageClient
        product={product}
        category={category}
        relatedProducts={relatedProducts}
        reviews={reviews}
        pageContent={pageContent}
      />
    </>
  );
}
