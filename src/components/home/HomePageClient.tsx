"use client";

import { HomeCategories } from "./HomeCategories";
import { HomeProducts } from "./HomeProducts";
import { HomeCTA } from "./HomeCTA";
import { HomeSupport } from "./HomeSupport";
import { HomeValues } from "./HomeValues";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import { StorefrontHero } from "@/components/storefront/home/StorefrontHero";
import { StorefrontStatsBar } from "@/components/storefront/home/StorefrontStatsBar";
import { StorefrontClosingSection } from "@/components/storefront/home/StorefrontClosingSection";
import { StorefrontTrustBar } from "@/components/storefront/commerce/StorefrontTrustBar";
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
    <>
      <StorefrontHero />

      <section className="v-section" data-density="compact" data-tone="base">
        <div className="v-section-inner">
          <StorefrontStatsBar deliveryEstimate={deliveryEstimate} />
          <StorefrontTrustBar />
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
      <StorefrontClosingSection />
    </>
  );
}
