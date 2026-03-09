import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
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
export const dynamicParams = false;

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
  const nonce = (await headers()).get("x-nonce") ?? undefined;

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
  const productImage = toAbsoluteUrl(`${productPath}/opengraph-image`);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [productImage],
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
    },
  };

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

  const categoryProducts = await getProductsByCategory(product.category_id);
  const relatedProducts = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  const reviews = await getVerifiedReviewsByProductId(product.id);
  const pageContent = getProductPageContent(product.slug);

  return (
    <>
      <script
        nonce={nonce}
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
