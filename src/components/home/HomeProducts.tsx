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
    <section id="productos" className="v-section" data-tone="mist">
      <div className="v-section-inner">
        <div className="v-section-grid gap-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,1fr)] lg:items-end">
            <div className="v-editorial-copy">
              <p className="section-badge">
                <Sparkles className="h-3.5 w-3.5" />
                {t("featured.badge")}
              </p>
              <h2 className="text-headline text-[var(--foreground)]">
                Productos destacados para comprar hoy sin complicarte.
              </h2>
              <p className="v-prose text-sm sm:text-base">
                Reunimos opciones que se entienden rápido: precio, descuento y
                entrega visibles desde el inicio para comprar con más confianza.
              </p>
            </div>

            <div className="surface-panel px-5 py-6 sm:px-7 sm:py-7">
              <div className="relative z-[1] grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/85 px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                    Más vendidos
                  </p>
                  <p className="mt-1.5 text-sm leading-7 text-[var(--muted)]">
                    Lo que más piden quienes quieren comprar sin dar tantas vueltas.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/85 px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                    Compra clara
                  </p>
                  <p className="mt-1.5 text-sm leading-7 text-[var(--muted)]">
                    Precio, descuento y envío visibles desde el primer momento.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
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

              <div className="flex justify-center">
                <Link href="#categorias">
                  <Button variant="outline" size="lg" className="gap-2.5 px-8">
                    {t("featured.viewMore")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="v-section-divider" />
      </div>
    </section>
  );
}
