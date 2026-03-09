import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getProductsByCategory,
} from "@/lib/db";
import { toAbsoluteUrl } from "@/lib/site";
import { getServerT } from "@/lib/i18n";
import { CategoryPageClient } from "./CategoryPageClient";

export const revalidate = 60;
export const dynamicParams = false;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getServerT();
  const ogLocale = "es_CO";
  const category = await getCategoryBySlug(slug);
  if (!category) {
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
      siteName: "Vortixy",
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

export default async function CategoryPage({ params }: Props) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

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
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: toAbsoluteUrl(`/categoria/${slug}`),
      },
    ],
  };

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([categorySchema, breadcrumbSchema]) }}
      />
      <CategoryPageClient category={category} products={products} />
    </>
  );
}
