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
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
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
  const deliveryEstimate = useDeliveryEstimate();
  const { formatDisplayPrice } = usePricing();
  const accent = category.color ?? "#49cc68";

  const heroProducts = useMemo(() => products.slice(0, 5), [products]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "name">("default");
  const activeProduct = heroProducts[activeIndex] ?? products[0] ?? null;

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  useEffect(() => {
    if (heroProducts.length <= 1) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = setInterval(() => {
      if (!document.hidden) {
        setActiveIndex((prev) => (prev + 1) % heroProducts.length);
      }
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const goToNext = () => {
    if (heroProducts.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % heroProducts.length);
  };

  const goToPrev = () => {
    if (heroProducts.length <= 1) return;
    setActiveIndex(
      (prev) => (prev - 1 + heroProducts.length) % heroProducts.length,
    );
  };

  if (!activeProduct) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 text-center shadow-lg">
          <div className="mx-auto mb-5 h-14 w-14 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center">
            <PackageSearch className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t("category.emptyTitle")}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500">
            {t("category.noProducts")}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {t("category.emptyNote")}
          </p>
          <Button asChild className="mt-6">
            <Link href="/">{t("common.backHome")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const activeProductCompareAt = getEffectiveCompareAtPrice(activeProduct);
  const discount = calculateDiscount(
    activeProduct.price,
    activeProductCompareAt,
  );

  return (
    <>
      <section
        className="py-12 sm:py-16 relative border-b border-gray-200"
        data-density="balanced"
        data-tone="mist"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-900 transition-colors font-medium">Inicio</Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-gray-900 font-semibold">{category.name}</span>
          </nav>
        </div>
        <div
          className="pointer-events-none absolute -top-40 -left-36 h-[420px] w-[420px] rounded-full blur-[90px] opacity-15"
          style={{ backgroundColor: accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: accent }}
        />
        <div className="pointer-events-none absolute top-0 right-0 w-1/2 h-full bg-transparent opacity-[0.04]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center">
                <IconComponent className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                  {t("category.collectionLabel")}
                </p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-gray-900">
                  {category.name}
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2">
              <ShippingBadge stockLocation="nacional" compact />
              <span className="text-xs text-gray-500">
                {products.length} {t("category.availableProducts")}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:min-h-[calc(100vh-11rem)]">
            <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-[linear-gradient(135deg,#f8fafc,#ecf4ef)] shadow-sm min-h-[320px] sm:min-h-[420px] lg:min-h-[520px]">
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
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-white text-gray-500 border border-gray-200">
                      <BadgeCheck
                        className="h-3.5 w-3.5"
                        style={{ color: accent }}
                      />
                      {t("category.editorialPick")}
                    </span>

                    {heroProducts.length > 1 ? (
                      <span className="text-xs text-gray-400">
                        {activeIndex + 1} / {heroProducts.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
                    <div className="relative h-full max-h-[520px] w-full max-w-[620px] overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50">
                      <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/80" />
                      {activeProduct.images[0] ? (
                        <Image
                          src={activeProduct.images[0]}
                          alt={activeProduct.name}
                          fill
                          className="object-contain p-5 sm:p-7"
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          quality={75}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-3xl border border-gray-200 bg-white flex items-center justify-center">
                            <IconComponent
                              className="h-20 w-20 sm:h-24 sm:w-24"
                              style={{ color: accent }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                      <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6">
                        <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
                          <p className="text-sm font-semibold line-clamp-1 text-gray-900">
                            {activeProduct.name}
                          </p>
                          <p className="mt-1 text-xs line-clamp-2 text-gray-500">
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
                        className="h-11 w-11 rounded-full border border-gray-200 text-gray-400 hover:bg-white inline-flex items-center justify-center transition-colors"
                        aria-label={t("category.prevProduct")}
                        type="button"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        {heroProducts.map((product, index) => (
                          <button
                            key={product.id}
                            onClick={() => setActiveIndex(index)}
                            data-compact-touch=""
                            className={cn(
                              "relative h-2.5 rounded-full overflow-hidden transition-all",
                              index === activeIndex
                                ? "w-8"
                                : "w-2.5 bg-gray-300",
                            )}
                            style={
                              index === activeIndex
                                ? { backgroundColor: `${accent}33` } // 20% opacity of accent
                                : {}
                            }
                            aria-label={t("category.viewProductIndex", {
                              index: index + 1,
                            })}
                            type="button"
                          >
                            {index === activeIndex && (
                              <div
                                className="absolute inset-0 origin-left"
                                style={{
                                  backgroundColor: accent,
                                  animation:
                                    "carousel-progress 5s linear forwards",
                                }}
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={goToNext}
                        className="h-11 w-11 rounded-full border border-gray-200 text-gray-400 hover:bg-white inline-flex items-center justify-center transition-colors"
                        aria-label={t("category.nextProduct")}
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
                  className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
                      <Star className="h-3.5 w-3.5" style={{ color: accent }} />
                      {t("category.featuredProduct")}
                    </span>
                    {discount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-400 text-emerald-950">
                        <Tag className="h-3.5 w-3.5" />-{discount}%
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {activeProduct.name}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed line-clamp-4 text-gray-500">
                    {activeProduct.description}
                  </p>

                  <div className="mt-6 flex items-end gap-3">
                    <span
                      suppressHydrationWarning
                      className="text-3xl sm:text-4xl font-bold text-gray-900"
                    >
                      {formatDisplayPrice(activeProduct.price)}
                    </span>
                    {activeProductCompareAt > 0 ? (
                      <span
                        suppressHydrationWarning
                        className="text-sm line-through mb-1 text-gray-400"
                      >
                        {formatDisplayPrice(activeProductCompareAt)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                        {t("category.heroShippingLabel")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {t("category.heroShippingValue")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                        {t("category.heroOperationLabel")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {t("category.heroOperationValue")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button asChild className="w-full sm:w-auto gap-2">
                      <Link href={`/producto/${activeProduct.slug}`}>
                        <ShoppingBag className="h-4 w-4" />
                        {t("category.viewProduct")}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <a href="#catalogo">
                        {t("category.viewCatalog")}
                      </a>
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {heroProducts.length > 1 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {heroProducts.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => setActiveIndex(index)}
                        type="button"
                        className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          index === activeIndex
                            ? "border-gray-200 bg-gray-50"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <p className="text-sm font-semibold line-clamp-1 text-gray-900">
                          {product.name}
                        </p>
                        <p
                          suppressHydrationWarning
                          className="mt-0.5 text-xs text-gray-400"
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

      <section
        id="catalogo"
        className="py-12 sm:py-16 bg-gray-50"
        data-density="compact"
        data-tone="base"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <p className="section-badge mb-3">{t("category.catalogLabel")}</p>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-semibold text-gray-900">
                  {sortedProducts.length}
                </span>{" "}
                {t("category.products")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-0.5 text-xs">
                {[
                  { key: "default" as const, label: "Destacados" },
                  { key: "price-asc" as const, label: "Precio ↑" },
                  { key: "price-desc" as const, label: "Precio ↓" },
                  { key: "name" as const, label: "A-Z" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                      sortBy === opt.key
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                type="button"
              >
                {t("footer.backToTop")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {sortedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                deliveryEstimate={deliveryEstimate}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-12 sm:py-16 border-t border-gray-200 bg-gray-50"
        data-density="compact"
        data-tone="contrast"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
