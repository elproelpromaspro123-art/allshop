"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
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
      className="py-16 sm:py-24 bg-[var(--gradient-section)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="section-badge mb-4">{t("featured.badge")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {t("featured.title")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              {t("featured.subtitle")}
            </p>
          </div>

          <div className="surface-panel px-5 py-5 sm:px-6">
            <div className="relative z-[1] flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                  Curaduría
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
                  {t("featured.qualityNote")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="surface-panel px-5 py-4 text-sm text-[var(--foreground)]">
            <div className="relative z-[1]">{t("featured.emptyState")}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                deliveryEstimate={deliveryEstimate}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-start">
          <Link href="#categorias">
            <Button variant="outline" size="sm" className="gap-1.5">
              {t("featured.viewMore")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
