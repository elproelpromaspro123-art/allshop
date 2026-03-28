"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ArrowUpDown,
  ChefHat,
  Dumbbell,
  Home,
  PackageSearch,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  BadgePercent,
  Flame,
  Tag,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShippingBadge } from "@/components/ShippingBadge";
import { Button } from "@/components/ui/Button";
import { getEffectiveCompareAtPrice } from "@/lib/promo-pricing";
import { calculateDiscount, cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useDeliveryEstimate } from "@/hooks/useDeliveryEstimate";
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

type SortMode = "default" | "featured" | "rating" | "price-asc" | "price-desc" | "name";

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getProductRelevanceScore(product: Product, query: string): number {
  if (!query) {
    return [
      product.is_featured ? 12 : 0,
      product.is_bestseller ? 8 : 0,
      typeof product.average_rating === "number" ? product.average_rating * 2 : 0,
      typeof product.reviews_count === "number" ? Math.min(product.reviews_count / 4, 6) : 0,
    ].reduce((sum, value) => sum + value, 0);
  }

  const name = normalizeText(product.name);
  const description = normalizeText(product.description);
  const slug = normalizeText(product.slug);
  let score = 0;

  if (name === query) score += 40;
  if (name.startsWith(query)) score += 24;
  if (name.includes(query)) score += 18;
  if (slug.includes(query)) score += 12;
  if (description.includes(query)) score += 8;
  if (product.is_featured) score += 4;
  if (product.is_bestseller) score += 4;
  if (typeof product.average_rating === "number") {
    score += product.average_rating * 1.5;
  }
  if (typeof product.reviews_count === "number") {
    score += Math.min(product.reviews_count / 5, 4);
  }

  return score;
}

export function CategoryPageClient({ category, products }: Props) {
  const IconComponent = CATEGORY_ICONS[category.icon ?? ""] ?? Sparkles;
  const { t } = useLanguage();
  const deliveryEstimate = useDeliveryEstimate();
  const { formatDisplayPrice } = usePricing();
  const accent = category.color ?? "#49cc68";
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortMode>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFreeShipping, setOnlyFreeShipping] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyTopRated, setOnlyTopRated] = useState(false);

  const normalizedQuery = normalizeText(searchQuery);
  const hasActiveFilters =
    Boolean(normalizedQuery) ||
    onlyFreeShipping ||
    onlyDiscounted ||
    onlyInStock ||
    onlyFeatured ||
    onlyTopRated ||
    sortBy !== "default";

  const clearFilters = () => {
    setSearchQuery("");
    setOnlyFreeShipping(false);
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setOnlyFeatured(false);
    setOnlyTopRated(false);
    setSortBy("default");
  };

  const filteredProducts = useMemo(() => {
    const searched = products.filter((product) => {
      const searchable = normalizeText(
        `${product.name} ${product.description} ${product.slug}`,
      );
      const matchesQuery = normalizedQuery ? searchable.includes(normalizedQuery) : true;
      const matchesFreeShipping = onlyFreeShipping ? product.free_shipping === true : true;
      const effectiveCompareAtPrice = getEffectiveCompareAtPrice(product);
      const matchesDiscounted = onlyDiscounted
        ? effectiveCompareAtPrice > product.price
        : true;
      const matchesStock = onlyInStock
        ? typeof product.total_stock === "number"
          ? product.total_stock > 0
          : true
        : true;
      const matchesFeatured = onlyFeatured ? product.is_featured === true : true;
      const matchesTopRated = onlyTopRated
        ? (Number(product.average_rating) || 0) >= 4.5
        : true;

      return (
        matchesQuery &&
        matchesFreeShipping &&
        matchesDiscounted &&
        matchesStock &&
        matchesFeatured &&
        matchesTopRated
      );
    });

    const sorted = [...searched];
    switch (sortBy) {
      case "featured":
        return sorted.sort((a, b) => {
          if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
            return Number(b.is_featured) - Number(a.is_featured);
          }
          if ((b.is_bestseller ? 1 : 0) !== (a.is_bestseller ? 1 : 0)) {
            return Number(b.is_bestseller) - Number(a.is_bestseller);
          }
          return getProductRelevanceScore(b, normalizedQuery) - getProductRelevanceScore(a, normalizedQuery);
        });
      case "rating":
        return sorted.sort((a, b) => {
          const aRating = Number(a.average_rating) || 0;
          const bRating = Number(b.average_rating) || 0;
          if (bRating !== aRating) return bRating - aRating;
          const aReviews = Number(a.reviews_count) || 0;
          const bReviews = Number(b.reviews_count) || 0;
          if (bReviews !== aReviews) return bReviews - aReviews;
          return getProductRelevanceScore(b, normalizedQuery) - getProductRelevanceScore(a, normalizedQuery);
        });
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
      default:
        return sorted.sort((a, b) => {
          const aScore = getProductRelevanceScore(a, normalizedQuery);
          const bScore = getProductRelevanceScore(b, normalizedQuery);
          if (bScore !== aScore) return bScore - aScore;

          if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
            return Number(b.is_featured) - Number(a.is_featured);
          }

          if ((b.is_bestseller ? 1 : 0) !== (a.is_bestseller ? 1 : 0)) {
            return Number(b.is_bestseller) - Number(a.is_bestseller);
          }

          const aRating = Number(a.average_rating) || 0;
          const bRating = Number(b.average_rating) || 0;
          if (bRating !== aRating) return bRating - aRating;

          const aCreatedAt = Date.parse(a.created_at || "");
          const bCreatedAt = Date.parse(b.created_at || "");
          if (Number.isFinite(bCreatedAt) && Number.isFinite(aCreatedAt) && bCreatedAt !== aCreatedAt) {
            return bCreatedAt - aCreatedAt;
          }

          return a.name.localeCompare(b.name, "es");
        });
    }
  }, [
    normalizedQuery,
    onlyDiscounted,
    onlyFeatured,
    onlyFreeShipping,
    onlyInStock,
    onlyTopRated,
    products,
    sortBy,
  ]);

  const heroProducts = useMemo(() => filteredProducts.slice(0, 5), [filteredProducts]);
  const normalizedActiveIndex =
    heroProducts.length > 0 ? activeIndex % heroProducts.length : 0;
  const activeProduct = heroProducts[normalizedActiveIndex] ?? filteredProducts[0] ?? null;
  const categoryImage = category.image_url ?? null;

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
    setActiveIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  const featuredCount = filteredProducts.filter((product) => product.is_featured).length;
  const discountedCount = filteredProducts.filter(
    (product) => getEffectiveCompareAtPrice(product) > product.price,
  ).length;
  const inStockCount = filteredProducts.filter(
    (product) =>
      typeof product.total_stock === "number" ? product.total_stock > 0 : true,
  ).length;
  const topRatedCount = filteredProducts.filter(
    (product) => (Number(product.average_rating) || 0) >= 4.5,
  ).length;

  if (!products.length) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50">
            <PackageSearch className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Catalogo vacio
          </p>
          <h1 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">
            {t("category.emptyTitle")}
          </h1>
          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            {t("category.noProducts")}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">{t("common.backHome")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{t("category.viewCatalog")}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const activeProductCompareAt = activeProduct
    ? getEffectiveCompareAtPrice(activeProduct)
    : 0;
  const discount = activeProduct
    ? calculateDiscount(activeProduct.price, activeProductCompareAt)
    : 0;

  return (
    <>
      <section className="relative border-b border-gray-200 py-12 sm:py-16">
        <div className="relative mx-auto max-w-7xl px-4 pb-0 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/" className="font-medium transition-colors hover:text-gray-900">
              Inicio
            </Link>
            <ArrowRight className="h-3 w-3" />
            <span className="font-semibold text-gray-900">{category.name}</span>
          </nav>
        </div>

        <div
          className="pointer-events-none absolute -left-36 -top-40 h-[420px] w-[420px] rounded-full opacity-15 blur-[90px]"
          style={{ backgroundColor: accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full opacity-10 blur-[100px]"
          style={{ backgroundColor: accent }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)] xl:items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white">
                  <IconComponent className="h-5 w-5" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                    Colección seleccionada
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {category.name}
                  </h1>
                </div>
              </div>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {category.description ||
                  "Exploración más clara, mejores señales de precio y una lectura mucho más rápida del catálogo."}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-700" />
                  {filteredProducts.length} productos visibles
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {topRatedCount} con valoracion alta
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
                  <BadgePercent className="h-3.5 w-3.5 text-emerald-700" />
                  {discountedCount} en oferta
                </span>
                <ShippingBadge stockLocation="nacional" compact />
              </div>
            </div>

            {categoryImage ? (
              <div className="relative overflow-hidden rounded-[1.8rem] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url("${categoryImage}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/22 to-transparent" />
                <div className="relative flex min-h-[220px] flex-col justify-end p-5 text-white sm:min-h-[260px] sm:p-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                    Categoria destacada
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                    {category.name}
                  </h2>
                  <p className="mt-2 line-clamp-3 max-w-sm text-sm leading-6 text-white/78">
                    {category.description ||
                      "Una portada visual dedicada para abrir el catalogo con mas identidad y lectura rapida."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
                  <Truck className="h-3.5 w-3.5 text-emerald-700" />
                  {filteredProducts.length} productos visibles
                </span>
              </div>
            )}
          </div>

          <div className="mb-8 grid gap-3 rounded-[1.8rem] border border-gray-200 bg-white/88 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar dentro de esta categoría"
                  className="h-12 w-full rounded-full border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  active={onlyFreeShipping}
                  onClick={() => setOnlyFreeShipping((value) => !value)}
                  label="Envío gratis"
                />
                <ToggleChip
                  active={onlyDiscounted}
                  onClick={() => setOnlyDiscounted((value) => !value)}
                  label="Con descuento"
                />
                <ToggleChip
                  active={onlyInStock}
                  onClick={() => setOnlyInStock((value) => !value)}
                  label="Con stock"
                />
                <ToggleChip
                  active={onlyFeatured}
                  onClick={() => setOnlyFeatured((value) => !value)}
                  label="Destacados"
                />
                <ToggleChip
                  active={onlyTopRated}
                  onClick={() => setOnlyTopRated((value) => !value)}
                  label="4.5+ estrellas"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Ordenar</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortMode)}
                className="bg-transparent font-semibold text-gray-900 outline-none"
              >
                <option value="default">Relevancia</option>
                <option value="featured">Destacados</option>
                <option value="rating">Mejor valorados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre</option>
              </select>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters} className="self-start">
                Limpiar filtros
              </Button>
            ) : null}
          </div>

          <div className="mb-10 grid gap-3 md:grid-cols-3">
            <MetricPanel label="Productos destacados" value={featuredCount} />
            <MetricPanel label="Opciones con descuento" value={discountedCount} />
            <MetricPanel label="Disponibles ahora" value={inStockCount} />
          </div>

          {activeProduct ? (
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:min-h-[calc(100vh-11rem)]">
              <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-gray-200 bg-[linear-gradient(135deg,#f8fafc,#ecf4ef)] shadow-sm sm:min-h-[420px] lg:min-h-[520px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProduct.id}
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 1.02 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0 flex flex-col p-6 sm:p-9"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500">
                        <BadgeCheck className="h-3.5 w-3.5" style={{ color: accent }} />
                        Selección editorial
                      </span>

                      {heroProducts.length > 1 ? (
                        <span className="text-xs text-gray-400">
                          {normalizedActiveIndex + 1} / {heroProducts.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-1 items-center justify-center py-4 sm:py-8">
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
                            <div className="flex h-40 w-40 items-center justify-center rounded-3xl border border-gray-200 bg-white sm:h-48 sm:w-48">
                              <IconComponent
                                className="h-20 w-20 sm:h-24 sm:w-24"
                                style={{ color: accent }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                          <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
                            <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                              {activeProduct.name}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
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
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:bg-white"
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
                                "relative h-2.5 overflow-hidden rounded-full transition-all",
                                index === normalizedActiveIndex ? "w-8" : "w-2.5 bg-gray-300",
                              )}
                              style={index === normalizedActiveIndex ? { backgroundColor: `${accent}33` } : {}}
                              aria-label={t("category.viewProductIndex", { index: index + 1 })}
                              type="button"
                            >
                              {index === normalizedActiveIndex ? (
                                <div
                                  className="absolute inset-0 origin-left"
                                  style={{
                                    backgroundColor: accent,
                                    animation: "carousel-progress 5s linear forwards",
                                  }}
                                />
                              ) : null}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={goToNext}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:bg-white"
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
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        <Star className="h-3.5 w-3.5" style={{ color: accent }} />
                        Producto guía
                      </span>
                      {discount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                          <Tag className="h-3.5 w-3.5" />-{discount}%
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      {activeProduct.name}
                    </h2>
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-500 sm:text-base">
                      {activeProduct.description}
                    </p>

                    <div className="mt-6 flex items-end gap-3">
                      <span
                        suppressHydrationWarning
                        className="text-3xl font-bold text-gray-900 sm:text-4xl"
                      >
                        {formatDisplayPrice(activeProduct.price)}
                      </span>
                      {activeProductCompareAt > 0 ? (
                        <span
                          suppressHydrationWarning
                          className="mb-1 text-sm text-gray-500 line-through"
                        >
                          {formatDisplayPrice(activeProductCompareAt)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                          Envío
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {deliveryEstimate
                            ? `${deliveryEstimate.min}-${deliveryEstimate.max} días`
                            : "Cobertura nacional"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                          Compra
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          Contraentrega
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button asChild className="w-full gap-2 sm:w-auto">
                        <Link href={`/producto/${activeProduct.slug}`}>
                          <ShoppingBag className="h-4 w-4" />
                          {t("category.viewProduct")}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full sm:w-auto">
                        <a href="#catalogo">Ver catálogo</a>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {heroProducts.length > 1 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-3">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {heroProducts.map((product, index) => (
                        <button
                          key={product.id}
                          onClick={() => setActiveIndex(index)}
                          type="button"
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-left transition-colors",
                            index === normalizedActiveIndex
                              ? "border-gray-200 bg-gray-50"
                              : "border-gray-100 hover:bg-gray-50",
                          )}
                        >
                          <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p suppressHydrationWarning className="mt-0.5 text-xs text-gray-400">
                            {formatDisplayPrice(product.price)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section
        id="catalogo"
        className="border-t border-gray-200 bg-gray-50 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Catálogo activo
              </p>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                {filteredProducts.length === products.length
                  ? "Toda la selección disponible"
                  : `${filteredProducts.length} resultados filtrados`}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                La categoría ahora admite búsqueda local, filtros rápidos y una lectura más clara del inventario.
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100">
                <PackageSearch className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">No encontramos coincidencias</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Cambia la búsqueda o apaga alguno de los filtros para volver a abrir el catálogo completo.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
                <Button asChild>
                  <Link href="/">{t("common.backHome")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  deliveryEstimate={deliveryEstimate}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-3 text-sm font-semibold transition-all",
        active
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.12)]"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900",
      )}
    >
      {label}
    </button>
  );
}

function MetricPanel({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.4rem] border border-gray-200 bg-white px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">
        {value}
      </p>
    </div>
  );
}
