"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChefHat,
  Dumbbell,
  Home,
  PackageSearch,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShippingBadge } from "@/components/ShippingBadge";
import { TrustBar } from "@/components/TrustBar";
import { Button } from "@/components/ui/Button";
import { getEffectiveCompareAtPrice } from "@/lib/promo-pricing";
import { calculateDiscount, cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import type { Category, Product } from "@/types";

const CATEGORY_ICONS: Record<string, ElementType> = {
  ChefHat,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
};

const AUTOPLAY_MS = 5000;

interface Props {
  category: Category;
  products: Product[];
}

export function CategoryPageClient({ category, products }: Props) {
  const IconComponent = CATEGORY_ICONS[category.icon ?? ""] ?? Sparkles;
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();
  const accent = category.color ?? "#49cc68";

  const heroProducts = useMemo(() => products.slice(0, 5), [products]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = heroProducts[activeIndex] ?? products[0] ?? null;

  useEffect(() => {
    if (heroProducts.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroProducts.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const goToNext = () => {
    if (heroProducts.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % heroProducts.length);
  };

  const goToPrev = () => {
    if (heroProducts.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  if (!activeProduct) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-10 text-center shadow-[0_24px_70px_-42px_rgba(16,24,40,0.35)]">
          <div className="mx-auto mb-5 h-14 w-14 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center">
            <PackageSearch className="h-6 w-6 text-[var(--accent-strong)]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Catálogo en actualización
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-600">
            {t("category.noProducts")}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Estamos preparando nuevos lanzamientos para esta categoría.
          </p>
          <Link href="/" className="inline-flex mt-6">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </section>
    );
  }

  const activeProductCompareAt = getEffectiveCompareAtPrice(activeProduct);
  const discount = calculateDiscount(activeProduct.price, activeProductCompareAt);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--background)]">
        <div
          className="pointer-events-none absolute -top-40 -left-36 h-[420px] w-[420px] rounded-full blur-[90px] opacity-20"
          style={{ backgroundColor: accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full blur-[100px] opacity-15"
          style={{ backgroundColor: accent }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl border border-[var(--border)] bg-white flex items-center justify-center">
                <IconComponent className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Colección Vortixy
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  {category.name}
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2">
              <ShippingBadge stockLocation="nacional" compact />
              <span className="text-xs text-[var(--muted)]">
                {products.length} {t("category.availableProducts")}
              </span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:min-h-[calc(100vh-11rem)]">
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,#f8fafc,#ecf4ef)] min-h-[420px] sm:min-h-[520px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProduct.id}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 1.02 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 p-6 sm:p-9 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-white text-neutral-600 border border-neutral-200">
                      <BadgeCheck className="h-3.5 w-3.5" style={{ color: accent }} />
                      Selección editorial
                    </span>

                    {heroProducts.length > 1 ? (
                      <span className="text-xs text-[var(--muted)]">
                        {activeIndex + 1} / {heroProducts.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
                    <div className="relative h-full max-h-[520px] w-full max-w-[620px] rounded-[2rem] border border-neutral-200 bg-white/80 overflow-hidden">
                      {activeProduct.images[0] ? (
                        <Image
                          src={activeProduct.images[0]}
                          alt={activeProduct.name}
                          fill
                          className="object-contain p-5 sm:p-7"
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          quality={90}
                          priority
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-[2rem] border border-neutral-200 bg-white flex items-center justify-center">
                            <IconComponent className="h-20 w-20 sm:h-24 sm:w-24" style={{ color: accent }} />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                      <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6">
                        <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 sm:px-5 sm:py-4">
                          <p className="text-sm font-semibold line-clamp-1 text-[var(--foreground)]">
                            {activeProduct.name}
                          </p>
                          <p className="mt-1 text-xs line-clamp-2 text-[var(--muted)]">
                            {activeProduct.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {heroProducts.length > 1 ? (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={goToPrev}
                        className="h-11 w-11 rounded-full border border-neutral-200 text-neutral-600 hover:bg-white inline-flex items-center justify-center transition-colors"
                        aria-label="Producto anterior"
                        type="button"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        {heroProducts.map((product, index) => (
                          <button
                            key={product.id}
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                              "relative h-2.5 rounded-full overflow-hidden transition-all",
                              index === activeIndex ? "w-8" : "w-2.5 bg-neutral-300"
                            )}
                            style={
                              index === activeIndex
                                ? { backgroundColor: `${accent}33` } // 20% opacity of accent
                                : {}
                            }
                            aria-label={`Ver producto ${index + 1}`}
                            type="button"
                          >
                            {index === activeIndex && (
                              <div
                                className="absolute inset-0 origin-left"
                                style={{
                                  backgroundColor: accent,
                                  animation: "carousel-progress 5s linear forwards",
                                }}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={goToNext}
                        className="h-11 w-11 rounded-full border border-neutral-200 text-neutral-600 hover:bg-white inline-flex items-center justify-center transition-colors"
                        aria-label="Producto siguiente"
                        type="button"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeProduct.id}-details`}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="rounded-[2rem] border border-[var(--border)] bg-white p-6 sm:p-7 shadow-[0_24px_70px_-42px_rgba(16,24,40,0.35)]"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-[var(--surface-muted)] text-[var(--muted)]">
                      <Star className="h-3.5 w-3.5" style={{ color: accent }} />
                      Producto destacado
                    </span>
                    {discount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-[var(--accent)] text-[#071a0a]">
                        <Tag className="h-3.5 w-3.5" />
                        -{discount}%
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.08] text-[var(--foreground)]">
                    {activeProduct.name}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed line-clamp-4 text-[var(--muted)]">
                    {activeProduct.description}
                  </p>

                  <div className="mt-6 flex items-end gap-3">
                    <span
                      suppressHydrationWarning
                      className="text-3xl sm:text-4xl font-bold text-[var(--foreground)]"
                    >
                      {formatDisplayPrice(activeProduct.price)}
                    </span>
                    {activeProductCompareAt > 0 ? (
                      <span
                        suppressHydrationWarning
                        className="text-sm line-through mb-1 text-neutral-400"
                      >
                        {formatDisplayPrice(activeProductCompareAt)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                        Envío
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">
                        Nacional Colombia
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                        Operación
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">
                        Contra entrega
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link href={`/producto/${activeProduct.slug}`}>
                      <Button className="w-full sm:w-auto gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Ver producto
                      </Button>
                    </Link>
                    <a href="#catalogo">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Ver catálogo
                      </Button>
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>

              {heroProducts.length > 1 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {heroProducts.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => setActiveIndex(index)}
                        type="button"
                        className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${index === activeIndex
                          ? "border-neutral-300 bg-neutral-50"
                          : "border-neutral-200 hover:bg-neutral-50"
                          }`}
                      >
                        <p className="text-sm font-semibold line-clamp-1 text-neutral-900">
                          {product.name}
                        </p>
                        <p
                          suppressHydrationWarning
                          className="mt-0.5 text-xs text-neutral-500"
                        >
                          {formatDisplayPrice(product.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
          <div className="mb-9 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                Catálogo de categoría
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">
                  {products.length}
                </span>{" "}
                {t("category.products")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              type="button"
            >
              Volver arriba
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
