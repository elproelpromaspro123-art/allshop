"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/providers/LanguageProvider";
import type { Product } from "@/types";

interface HomeProductsProps {
  products: Product[];
  deliveryEstimate: { min: number; max: number } | null;
}

export function HomeProducts({
  products,
  deliveryEstimate,
}: HomeProductsProps) {
  const { t } = useLanguage();

  return (
    <section
      id="productos"
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[var(--gradient-section)]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--secondary)]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header section with improved layout */}
        <div className="mb-12 lg:mb-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            {/* Left side - Title and description */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                <Sparkles className="w-3.5 h-3.5" />
                {t("featured.badge")}
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--foreground)]">
                {t("featured.title")}
              </h2>
              
              <p className="text-sm leading-relaxed text-[var(--muted)] sm:text-base max-w-xl">
                {t("featured.subtitle")}
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)] shadow-sm ring-1 ring-black/5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-strong)]" />
                  Más vendidos
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)] shadow-sm ring-1 ring-black/5">
                  <BadgeCheck className="w-3.5 h-3.5 text-[var(--secondary-strong)]" />
                  Calidad verificada
                </div>
              </div>
            </div>

            {/* Right side - Quality card */}
            <div className="relative">
              <div className="surface-panel px-6 py-6 sm:px-8 sm:py-7 overflow-hidden">
                <div className="relative z-[1] flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] text-white shadow-lg">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-faint)]">
                      Curaduría Premium
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
                      {t("featured.qualityNote")}
                    </p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[var(--accent)]/5 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[var(--secondary)]/5 blur-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Products grid with improved responsive design */}
        {products.length === 0 ? (
          <div className="surface-panel px-6 py-8 text-sm text-[var(--foreground)]">
            <div className="relative z-[1] text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-muted)]">
                <Sparkles className="h-7 w-7 text-[var(--muted-faint)]" />
              </div>
              <p className="font-semibold text-[var(--muted-strong)]">
                {t("featured.emptyState")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid with better responsive breakpoints */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  deliveryEstimate={deliveryEstimate}
                  enableImageRotation
                />
              ))}
            </div>

            {/* Enhanced CTA button */}
            <div className="mt-12 flex justify-center">
              <Link href="#categorias">
                <Button
                  variant="outline"
                  size="lg"
                  className="group gap-2.5 px-8 py-6 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {t("featured.viewMore")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
