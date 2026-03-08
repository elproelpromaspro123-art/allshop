import { getCategories, getFeaturedProducts } from "@/lib/db";
import { HomePageClient } from "@/components/home/HomePageClient";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <HomePageClient
      categories={categories}
      featuredProducts={featuredProducts}
    />
  );
}
