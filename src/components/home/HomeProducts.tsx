"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, Truck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
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
    prioritizedProducts.find((p) => p.is_featured) ?? null;
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
      () => setCurrentImageIndex((p) => (p + 1) % spotlightImages.length),
      3000,
    );
    return () => clearInterval(interval);
  }, [spotlightImages.length]);

  return (
    <section id="productos" className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            <Sparkles className="h-3.5 w-3.5" />
            {t("featured.badge")}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Los más pedidos esta semana
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Precio final, envío y stock visibles desde el primer vistazo.
          </p>
        </div>

        {/* Spotlight product */}
        {spotlightProduct && (
          <div
            data-testid="home-spotlight-card"
            className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 shadow-2xl sm:p-8 lg:p-10"
          >
            <div className="grid items-center gap-8 lg:grid-cols-2">
              {/* Image */}
              <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/8 p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="relative h-full w-full"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-white/90 shadow-lg">
                      <Image
                        src={spotlightImages[activeIndex] || spotlightImages[0] || "/icon.svg"}
                        alt={spotlightProduct.name}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 640px) 80vw, 400px"
                        quality={85}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {spotlightImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                    {spotlightImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        data-compact-touch=""
                        onClick={() => setCurrentImageIndex(i)}
                        className={`rounded-full transition-all ${
                          i === activeIndex
                            ? "h-1.5 w-5 bg-white"
                            : "h-1.5 w-1.5 bg-white/40 hover:bg-white/60"
                        }`}
                        aria-label={`Imagen ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-white">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                    Producto estrella
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                    <Truck className="h-3 w-3" />
                    Envío gratis
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {spotlightProduct.name}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-white/70">
                  Precio visible, envío incluido y soporte directo si tienes preguntas.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Precio</p>
                    <p suppressHydrationWarning className="mt-1 text-lg font-bold">
                      {formatDisplayPrice(spotlightProduct.price)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Entrega</p>
                    <p className="mt-1 text-sm font-semibold">{deliveryLine}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Pago</p>
                    <p className="mt-1 text-sm font-semibold">Al recibir</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button asChild size="lg" className="gap-2 border-white/20 bg-white px-8 text-emerald-700 shadow-lg hover:bg-emerald-50">
                    <Link href={`/producto/${spotlightProduct.slug}`}>
                      Ver producto
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product grid */}
        {prioritizedProducts.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="font-semibold text-gray-600">{t("featured.emptyState")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
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
              <Button asChild variant="outline" size="lg" className="gap-2 px-8">
                <Link href="#categorias">
                  {t("featured.viewMore")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
