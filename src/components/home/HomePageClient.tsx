"use client";

import { HomeHero } from "./HomeHero";
import { HomeCategories } from "./HomeCategories";
import { HomeProducts } from "./HomeProducts";
import { HomeValues } from "./HomeValues";
import { HomeCTA } from "./HomeCTA";
import { HomeSupport } from "./HomeSupport";
import { Testimonials } from "@/components/Testimonials";
import { AboutSection } from "@/components/AboutSection";
import { TrustBar } from "@/components/TrustBar";
import { StatsBar } from "@/components/StatsBar";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
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
      <HomeHero />
      
      <section className="bg-[var(--background)] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsBar deliveryEstimate={deliveryEstimate} />
        </div>
      </section>

      <HomeCategories categories={categories} />
      <HomeProducts products={featuredProducts} deliveryEstimate={deliveryEstimate} />
      <HomeValues />
      <HomeCTA />
      <Testimonials />
      <AboutSection />
      <HomeSupport />
      <TrustBar />
    </>
  );
}
