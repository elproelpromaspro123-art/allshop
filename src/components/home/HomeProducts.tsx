"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import type { Product } from "@/types";

interface HomeProductsProps {
  products: Product[];
  deliveryEstimate: { min: number; max: number } | null;
}

export function HomeProducts({ products, deliveryEstimate }: HomeProductsProps) {
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const prioritizedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return 0;
      }),
    [products],
  );

  const spotlightProduct =
    prioritizedProducts.find((product) => product.is_featured) ??
    prioritizedProducts[0] ??
    null;
  const compactProducts = prioritizedProducts
    .filter((product) => product.id !== spotlightProduct?.id)
    .slice(0, 3);
  const spotlightImages = spotlightProduct?.images.length
    ? [...spotlightProduct.images].sort((a, b) => {
        const aHero = /hero/i.test(a);
        const bHero = /hero/i.test(b);
        if (aHero === bHero) return 0;
        return aHero ? -1 : 1;
      })
    : [];
  const activeIndex = spotlightImages.length
    ? currentImageIndex % spotlightImages.length
    : 0;
  const deliveryLine = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "Tiempos visibles antes de confirmar";

  useEffect(() => {
    if (spotlightImages.length <= 1) return;
    const interval = setInterval(
      () => setCurrentImageIndex((previous) => (previous + 1) % spotlightImages.length),
      3000,
    );
    return () => clearInterval(interval);
  }, [spotlightImages.length]);

  return (
    <section
      id="productos"
      data-home-slide=""
      data-density="balanced"
      data-tone="contrast"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="hero">
          <div className="v-editorial-copy">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t("featured.badge")}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                El catálogo principal ahora se presenta como una escena enfocada.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Dejé de apilar tarjetas sin jerarquía. Primero ves el producto
                que manda la historia y después una selección corta para seguir
                explorando sin perder contexto.
              </p>
            </div>

            <div className="v-chip-row">
              <div className="v-chip">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span>
                  Entrega: <strong>{deliveryLine}</strong>
                </span>
              </div>
              <div className="v-chip">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>
                  Precio visible desde <strong>la primera vista</strong>
                </span>
              </div>
            </div>

            {prioritizedProducts.length === 0 ? (
              <div className="rounded-[1.7rem] border border-slate-200/80 bg-white/92 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="font-semibold text-slate-600">
                  {t("featured.emptyState")}
                </p>
              </div>
            ) : (
              <div id="productos-grid" className="grid gap-3">
                {(compactProducts.length > 0
                  ? compactProducts
                  : prioritizedProducts.slice(0, 3)
                ).map((product) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    className="group rounded-[1.7rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_18px_54px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_28px_70px_rgba(16,185,129,0.14)] sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.1rem] border border-slate-200 bg-slate-50">
                        <Image
                          src={product.images[0] || "/icon.svg"}
                          alt={product.name}
                          fill
                          className="object-contain p-2.5"
                          sizes="80px"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                          Selección rápida
                        </p>
                        <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-tight text-slate-950">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p
                            suppressHydrationWarning
                            className="text-sm font-bold text-slate-700"
                          >
                            {formatDisplayPrice(product.price)}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[0.72rem] font-black uppercase tracking-[0.2em] text-emerald-700">
                            Ver
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
                <Link href="#categorias">
                  Explorar categorías
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {spotlightProduct ? (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full px-8 sm:w-auto"
                >
                  <Link href={`/producto/${spotlightProduct.slug}`}>
                    Ver producto estrella
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {spotlightProduct ? (
            <div
              data-testid="home-spotlight-card"
              className="brand-stage rounded-[2rem] p-5 sm:p-6 lg:p-7"
            >
              <div className="relative z-[1] grid gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/80">
                    Producto estrella
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-100">
                    <Truck className="h-3 w-3" />
                    Pago al recibir
                  </span>
                </div>

                <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1fr)]">
                  <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/8 p-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="relative h-full w-full"
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-[1.3rem] bg-white/92 shadow-lg">
                          <Image
                            src={
                              spotlightImages[activeIndex] ||
                              spotlightImages[0] ||
                              "/icon.svg"
                            }
                            alt={spotlightProduct.name}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 640px) 80vw, 360px"
                            quality={85}
                          />
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {spotlightImages.length > 1 ? (
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                        {spotlightImages.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            data-compact-touch=""
                            onClick={() => setCurrentImageIndex(index)}
                            className={`rounded-full transition-all ${
                              index === activeIndex
                                ? "h-1.5 w-5 bg-white"
                                : "h-1.5 w-1.5 bg-white/40 hover:bg-white/60"
                            }`}
                            aria-label={`Imagen ${index + 1}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-5 text-white">
                    <div>
                      <h3 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-[2.25rem]">
                        {spotlightProduct.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-white/74 sm:text-base">
                        Precio, entrega y recorrido de compra visibles sin
                        obligarte a abrir diez pantallas para entender el
                        producto.
                      </p>
                    </div>

                    <div className="v-metric-grid">
                      <div className="v-metric-card">
                        <p className="v-metric-label">Precio</p>
                        <p suppressHydrationWarning className="v-metric-value">
                          {formatDisplayPrice(spotlightProduct.price)}
                        </p>
                      </div>
                      <div className="v-metric-card">
                        <p className="v-metric-label">Entrega</p>
                        <p className="v-metric-value">{deliveryLine}</p>
                      </div>
                      <div className="v-metric-card">
                        <p className="v-metric-label">Soporte</p>
                        <p className="v-metric-value">WhatsApp y seguimiento</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        asChild
                        size="lg"
                        className="w-full gap-2 border-white/20 bg-white px-8 text-emerald-700 shadow-lg hover:bg-emerald-50 sm:w-auto"
                      >
                        <Link href={`/producto/${spotlightProduct.slug}`}>
                          Ver producto
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="w-full border-white/30 px-8 text-white hover:bg-white/10 sm:w-auto"
                      >
                        <Link href="/#categorias">Seguir explorando</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="v-section-divider" />
    </section>
  );
}
