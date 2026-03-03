import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, PRODUCTS } from "@/data/mock";
import { CategoryPageClient } from "./CategoryPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: "Categoría no encontrada" };

  return {
    title: `${category.name} — Productos seleccionados`,
    description: `${category.description}. Envío express en Colombia, garantía AllShop y devolución gratis.`,
    openGraph: {
      title: `${category.name} | AllShop Colombia`,
      description: category.description ?? "",
    },
  };
}

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = PRODUCTS.filter((p) => p.category_id === category.id && p.is_active);

  return <CategoryPageClient category={category} products={products} />;
}
