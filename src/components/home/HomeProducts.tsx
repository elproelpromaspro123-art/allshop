"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
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
    prioritizedProducts.find((product) => product.is_featured) ?? null;
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
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} dias habiles`
    : "3-7 dias habiles";

  useEffect(() => {
    if (spotlightImages.length <= 1) return;
    const interval = setInterval(
      () =>
        setCurrentImageIndex(
          (previous) => (previous + 1) % spotlightImages.length,
        ),
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
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {t("featured.badge")}
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Los mas pedidos esta semana
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Precio final, envio y stock visibles desde el primer vistazo.
            Elegi el tuyo y pagas cuando llegue a tu puerta.
          </p>
        </div>

        {spotlightProduct ? (
          <div
            data-testid="home-spotlight-card"
            className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.22)] sm:p-8 lg:p-10"
          >
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/8 p-4">
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
                        src={
                          spotlightImages[activeIndex] ||
                          spotlightImages[0] ||
                          "/icon.svg"
                        }
                        alt={spotlightProduct.name}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 640px) 80vw, 400px"
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

              <div className="text-white">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em]">
                    Producto estrella
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-100">
                    <Truck className="h-3 w-3" />
                    Pago al recibir
                  </span>
                </div>

                <h3 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-[2.25rem]">
                  {spotlightProduct.name}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-white/70 sm:text-lg">
                  Precio visible, envio incluido y soporte directo por WhatsApp
                  si tienes preguntas antes de comprar.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 sm:text-xs">
                      Precio
                    </p>
                    <p suppressHydrationWarning className="mt-1 text-lg font-bold sm:text-xl">
                      {formatDisplayPrice(spotlightProduct.price)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 sm:text-xs">
                      Entrega
                    </p>
                    <p className="mt-1 text-sm font-semibold sm:text-base">
                      {deliveryLine}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 sm:text-xs">
                      Pago
                    </p>
                    <p className="mt-1 text-sm font-semibold sm:text-base">
                      Al recibir
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="w-full gap-2 !border-white !bg-white !text-emerald-800 !shadow-lg hover:!bg-emerald-50 sm:w-auto"
                  >
                    <Link href={`/producto/${spotlightProduct.slug}`}>
                      Ver producto
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="w-full gap-2 border-white/25 bg-white/15 px-8 text-white backdrop-blur-sm hover:bg-white/25 sm:w-auto"
                  >
                    <Link href="/#categorias">Seguir explorando</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {prioritizedProducts.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="font-semibold text-gray-600">
              {t("featured.emptyState")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                  <Truck className="h-3.5 w-3.5" />
                  Entrega visible
                </div>
                <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                  {deliveryLine}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Precio, envio y stock quedan a la vista antes de abrir la ficha.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.18)]">
                <div className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-200/78">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pago al recibir
                </div>
                <p className="mt-3 text-lg font-bold tracking-tight">
                  Sin tarjeta ni pasos extra para cerrar la compra.
                </p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  El checkout se mantiene corto y enfocado para no romper la
                  decision cuando ya estas listo.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Seleccion curada
                </div>
                <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                  {prioritizedProducts.length} productos listos para decidir.
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Priorizamos lo que vende mejor para que no tengas que
                  filtrar demasiado.
                </p>
              </div>
            </div>

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
                  Ver todas las categorias
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="v-section-divider" />
    </section>
  );
}
