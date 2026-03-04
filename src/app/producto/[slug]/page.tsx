import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getProductsByCategory,
  getCategories,
  getProductSlugs,
} from "@/lib/db";
import { toAbsoluteUrl } from "@/lib/site";
import { getServerT } from "@/lib/i18n";
import { ProductPageClient } from "./ProductPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getServerT();
  const ogLocale = "es_CO";
  const product = await getProductBySlug(slug);
  if (!product) return { title: t("product.metaNotFound") };

  const categories = await getCategories();
  const category = categories.find((c) => c.id === product.category_id);
  const canonicalPath = `/producto/${slug}`;
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
      siteName: "Vortixy Premium",
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

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const categories = await getCategories();
  const category = categories.find((c) => c.id === product.category_id) ?? null;

  const productPath = `/producto/${slug}`;
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
      name: "Vortixy Premium",
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

  const categoryProducts = await getProductsByCategory(product.category_id);
  const relatedProducts = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductPageClient
        product={product}
        category={category}
        relatedProducts={relatedProducts}
      />
    </>
  );
}

