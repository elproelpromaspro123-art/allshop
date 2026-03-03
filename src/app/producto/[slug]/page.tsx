import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCTS, CATEGORIES } from "@/data/mock";
import { ProductPageClient } from "./ProductPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return { title: "Producto no encontrado" };

  const category = CATEGORIES.find((c) => c.id === product.category_id);

  return {
    title: product.meta_title || `${product.name} — Comprar en AllShop`,
    description:
      product.meta_description ||
      `${product.description.slice(0, 160)}. Envío express en Colombia.`,
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 200),
      type: "website",
    },
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "COP",
      "product:availability": "in stock",
      "product:category": category?.name || "",
    },
  };
}

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.id === product.category_id);
  const relatedProducts = PRODUCTS.filter(
    (p) => p.category_id === product.category_id && p.id !== product.id && p.is_active
  ).slice(0, 4);

  return (
    <ProductPageClient
      product={product}
      category={category ?? null}
      relatedProducts={relatedProducts}
    />
  );
}
