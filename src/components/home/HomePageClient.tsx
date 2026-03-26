"use client";

import { HomeCategories } from "./HomeCategories";
import { HomeProducts } from "./HomeProducts";
import { HomeCTA } from "./HomeCTA";
import { HomeSupport } from "./HomeSupport";
import { HomeValues } from "./HomeValues";
import { HomeRecentlyViewed } from "./HomeRecentlyViewed";
import { HomeProofSection } from "./HomeProofSection";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import { StorefrontHero } from "@/components/storefront/home/StorefrontHero";
import type { Category, Product } from "@/types";

interface HomePageClientProps {
  categories: Category[];
  featuredProducts: Product[];
}

export function HomePageClient({
  categories,
  featuredProducts,
}: HomePageClientProps) {
  const deliveryEstimate = useDeliveryEstimate();

  return (
    <div data-home-slides="">
      <StorefrontHero deliveryEstimate={deliveryEstimate} />
      <HomeProofSection deliveryEstimate={deliveryEstimate} />
      <HomeCategories categories={categories} />
      <HomeProducts
        products={featuredProducts}
        deliveryEstimate={deliveryEstimate}
      />
      <HomeRecentlyViewed />
      <HomeValues />
      <HomeSupport />
      <HomeCTA />
    </div>
  );
}
