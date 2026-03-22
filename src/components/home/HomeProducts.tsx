"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
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
  const { formatDisplayPrice } = usePricing();
  const prioritizedProducts = useMemo(
    () =>
      [...products].sort((left, right) => {
        if (left.slug === "airpods-pro-3") return -1;
        if (right.slug === "airpods-pro-3") return 1;
        return 0;
      }),
    [products],
  );
  const spotlightProduct =
    prioritizedProducts.find((product) => product.slug === "airpods-pro-3") ??
    null;
  const deliveryLine = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "tiempos visibles antes de confirmar";

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
                Destacados listos para decidir más rápido.
              </h2>
              <p className="v-prose text-sm sm:text-base">
                Precio, descuento y entrega visibles desde el inicio para que el catálogo se sienta más claro y ordenado.
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
                    Productos con mejor respuesta y una decisión de compra más directa.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/85 px-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                    Entrega visible
                  </p>
                  <p className="mt-1.5 text-sm leading-7 text-[var(--muted)]">
                    El tiempo estimado aparece antes de que tomes una decisión.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {spotlightProduct ? (
            <div className="surface-panel-dark surface-ambient brand-v-slash overflow-hidden px-5 py-6 sm:px-7 sm:py-8">
              <div className="relative z-[1] grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-3 sm:p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.45rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_48%,rgba(0,0,0,0.08))]">
                    <Image
                      src={spotlightProduct.images[0] || "/icon.svg"}
                      alt={spotlightProduct.name}
                      fill
                      className="object-contain p-4 sm:p-6"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      quality={85}
                    />
                  </div>
                </div>

                <div className="v-editorial-copy">
                  <div className="v-chip-row">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/78">
                      Producto estrella
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/84">
                      <Truck className="h-3.5 w-3.5" />
                      Envío gratis
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/78">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Contraentrega
                    </span>
                  </div>

                  <p className="v-kicker text-white/88">Selección destacada de hoy</p>
                  <h3 className="text-headline text-white">
                    AirPods Pro 3 para una compra fuerte, clara y rápida.
                  </h3>
                  <p className="max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                    Combina precio claro, envío gratis y una ficha visual mucho más sólida que el resto del catálogo.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">
                        Precio hoy
                      </p>
                      <p className="mt-2 text-xl font-bold tracking-tight text-white">
                        {formatDisplayPrice(spotlightProduct.price)}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">
                        Entrega
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {deliveryLine}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">
                        Compra
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        Pagas cuando recibes
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild size="lg" className="gap-2 px-7">
                      <Link href={`/producto/${spotlightProduct.slug}`}>
                        Ver AirPods Pro 3
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-sm text-white/70">
                      Ficha completa, fotos limpias y soporte antes de comprar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {prioritizedProducts.length === 0 ? (
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
              <div
                id="productos-grid"
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"
              >
                {prioritizedProducts.map((product, index) => (
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
                <Button asChild variant="outline" size="lg" className="gap-2.5 px-8">
                  <Link href="#categorias">
                    {t("featured.viewMore")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="v-section-divider" />
      </div>
    </section>
  );
}
