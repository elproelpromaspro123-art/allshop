import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCategoryBySlug,
  getProductsByCategory,
  getCategorySlugs,
} from "@/lib/db";
import { toAbsoluteUrl } from "@/lib/site";
import { getServerT } from "@/lib/i18n";
import { CategoryPageClient } from "./CategoryPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getServerT();
  const ogLocale = "es_CO";
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: t("category.metaNotFound") };

  const canonicalPath = `/categoria/${slug}`;
  const title = t("category.metaTitle", { name: category.name });
  const description = t("category.metaDescription", {
    description: category.description ?? "",
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
          alt: t("category.metaImageAlt", { name: category.name }),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: toAbsoluteUrl(`/categoria/${slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
      />
      <CategoryPageClient category={category} products={products} />
    </>
  );
}

