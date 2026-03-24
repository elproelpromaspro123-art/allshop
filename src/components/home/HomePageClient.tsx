"use client";

import { HomeHero } from "./HomeHero";
import { HomeCategories } from "./HomeCategories";
import { HomeProducts } from "./HomeProducts";
import { HomeCTA } from "./HomeCTA";
import { HomeSupport } from "./HomeSupport";
import { HomeValues } from "./HomeValues";
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

      <section className="v-section" data-density="compact" data-tone="base">
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
      <HomeValues />
      <HomeSupport />
      <HomeCTA />
      <HomeClosingSection />
    </>
  );
}
