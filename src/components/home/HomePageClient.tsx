"use client";

import { HomeHero } from "./HomeHero";
import { HomeCategories } from "./HomeCategories";
import { HomeProducts } from "./HomeProducts";
import { TrustBar } from "@/components/TrustBar";
import { StatsBar } from "@/components/StatsBar";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import type { Category, Product } from "@/types";
import { HomeClosingSection } from "./HomeClosingSection";

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
    <>
      <HomeHero />

      <section className="v-section" data-tone="base">
        <div className="v-section-inner">
          <StatsBar deliveryEstimate={deliveryEstimate} />
          <TrustBar />
        </div>
      </section>

      <HomeCategories categories={categories} />
      <HomeProducts
        products={featuredProducts}
        deliveryEstimate={deliveryEstimate}
      />
      <HomeClosingSection />
    </>
  );
}
