"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  Star,
  Waypoints,
  RotateCcw,
  Headset,
  Clock3,
  ShieldCheck,
  Truck,
  CheckCircle2,
  BadgeCheck,
  PackageX,
  Lock,
} from "lucide-react";
import { cn, calculateDiscount } from "@/lib/utils";
import { isProductShippingFree } from "@/lib/shipping";
import { getEffectiveCompareAtPrice } from "@/lib/promo-pricing";
import { PRODUCT_STOCK_POLL_MS } from "@/lib/polling-intervals";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { TrustBar } from "@/components/TrustBar";
import { LiveVisitors } from "@/components/LiveVisitors";
import { PaymentLogos } from "@/components/PaymentLogos";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { fetchDeliveryEstimateClient } from "@/lib/delivery-estimate-client";
import type { ProductPageContent } from "@/lib/product-page-content";

import type { Product, Category, ProductReview } from "@/types";

interface Props {
  product: Product;
  category: Category | null;
  relatedProducts: Product[];
  reviews: ProductReview[];
  pageContent: ProductPageContent;
}



interface StockPayload {
  live: boolean;
  total_stock: number | null;
  variants: Array<{
    name: string;
    stock: number | null;
    variation_id: number | null;
  }>;
  calculated_at?: string;
  message?: string;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const COLOR_IMAGE_HINTS_BY_SLUG: Record<string, Record<string, string[] | null>> = {
  "silla-gamer-premium-reposapies": {
    "negro rojo": ["negro-con-rojo"],
    "negro azul": null,
    negro: ["silla-negra.jpeg", "silla-negra"],
    "negro blanco": ["negro-con-blanco"],
    "negro gris": ["silla-negra-con-gris.jpeg", "silla-negra-con-gris"],
    rosa: ["silla-rosa"],
  },
  "audifonos-xiaomi-redmi-buds-4-lite": {
    negro: ["buds4-1", "buds4-2", "buds4.png"],
    blanco: ["buds4-W-1", "buds4-W"],
  },
};

function findImageByHints(images: string[], hints: string[]): string | null {
  const normalizedHints = hints.map((hint) => normalizeText(hint));
  return (
    images.find((image) => {
      const normalizedImage = normalizeText(image);
      return normalizedHints.some((hint) => normalizedImage.includes(hint));
    }) || null
  );
}

export function ProductPageClient({
  product,
  category,
  relatedProducts,
  reviews,
  pageContent,
}: Props) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants.forEach((variant) => {
      if (variant.options.length > 0) {
        initial[variant.name] = variant.options[0];
      }
    });
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [hasUserSelectedColor, setHasUserSelectedColor] = useState(false);
  const [isManualImageSelection, setIsManualImageSelection] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    min: number;
    max: number;
    range: string;
    department: string;
    city: string | null;
  } | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(true);
  const [stockPayload, setStockPayload] = useState<StockPayload | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const relatedEstimate = deliveryEstimate
    ? { min: deliveryEstimate.min, max: deliveryEstimate.max }
    : null;

  const addItem = useCartStore((store) => store.addItem);
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    formatDisplayPrice,
    formatPaymentPrice,
    isDisplayDifferentFromPayment,
  } = usePricing();
  const effectiveCompareAtPrice = getEffectiveCompareAtPrice(product);
  const discount = calculateDiscount(product.price, effectiveCompareAtPrice);
  const variantString = Object.values(selectedVariants).join(" / ") || null;
  const productHasFreeShipping = isProductShippingFree({
    id: product.id,
    slug: product.slug,
    free_shipping: product.free_shipping ?? null,
  });

  const colorVariant = product.variants.find(
    (variant) => normalizeText(variant.name) === "color"
  );

  const selectedColor = colorVariant ? selectedVariants[colorVariant.name] : null;

  const imageByColor = useMemo(() => {
    const map = new Map<string, string | null>();
    if (!colorVariant) return map;
    const explicitHints = COLOR_IMAGE_HINTS_BY_SLUG[product.slug] || null;
    const hasOneImagePerColor = product.images.length === colorVariant.options.length;

    colorVariant.options.forEach((option, index) => {
      const normalizedOption = normalizeText(option);
      const colorHints = explicitHints?.[normalizedOption];
      if (colorHints === null) {
        map.set(normalizedOption, null);
        return;
      }

      if (Array.isArray(colorHints) && colorHints.length > 0) {
        const hintedImage = findImageByHints(product.images, colorHints);
        if (hintedImage) {
          map.set(normalizedOption, hintedImage);
          return;
        }
      }

      const imageIndex = hasOneImagePerColor
        ? index
        : Math.min(index + 1, product.images.length - 1);
      const image = product.images[imageIndex] || product.images[0] || "";
      map.set(normalizedOption, image || null);
    });

    return map;
  }, [colorVariant, product.images, product.slug]);

  const imageIndexByColor = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!colorVariant) return map;
    const explicitHints = COLOR_IMAGE_HINTS_BY_SLUG[product.slug] || null;
    const hasOneImagePerColor = product.images.length === colorVariant.options.length;

    colorVariant.options.forEach((option, index) => {
      const normalizedOption = normalizeText(option);
      const colorHints = explicitHints?.[normalizedOption];
      if (colorHints === null) {
        map.set(normalizedOption, null);
        return;
      }

      if (Array.isArray(colorHints) && colorHints.length > 0) {
        const hintedImage = findImageByHints(product.images, colorHints);
        if (hintedImage) {
          const hintedIndex = product.images.findIndex((image) => image === hintedImage);
          map.set(normalizedOption, hintedIndex >= 0 ? hintedIndex : null);
          return;
        }
      }

      const imageIndex = hasOneImagePerColor
        ? index
        : Math.min(index + 1, product.images.length - 1);
      map.set(normalizedOption, imageIndex);
    });

    return map;
  }, [colorVariant, product.images, product.slug]);

  const activeImagePath = product.images[activeImage] || product.images[0] || "";
  const cartImage = isManualImageSelection
    ? activeImagePath
    : selectedColor
      ? imageByColor.get(normalizeText(selectedColor)) || activeImagePath
      : activeImagePath;

  useEffect(() => {
    if (!selectedColor || !hasUserSelectedColor || isManualImageSelection) return;
    const targetIndex = imageIndexByColor.get(normalizeText(selectedColor));
    if (typeof targetIndex === "number" && targetIndex !== activeImage) {
      setActiveImage(targetIndex);
    }
  }, [activeImage, hasUserSelectedColor, imageIndexByColor, isManualImageSelection, selectedColor]);

  const selectedColorStock = useMemo(() => {
    if (!selectedColor) return null;
    const variants = Array.isArray(stockPayload?.variants) ? stockPayload.variants : [];
    if (variants.length === 0) return null;
    return (
      variants.find(
        (item) => normalizeText(item.name) === normalizeText(selectedColor)
      ) || null
    );
  }, [selectedColor, stockPayload]);
  const isSelectedColorOutOfStock =
    typeof selectedColorStock?.stock === "number" && selectedColorStock.stock <= 0;
  const shouldShowOutOfStockImagePlaceholder =
    Boolean(selectedColor) && isSelectedColorOutOfStock;

  const shouldShowUrgencyNudge = useMemo(() => {
    // Return early if stock is loading or hasn't loaded
    if (typeof stockPayload?.total_stock !== "number") return false;
    return stockPayload.total_stock > 0 && stockPayload.total_stock <= 30;
  }, [stockPayload?.total_stock]);

  const stockByVariantOption = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!Array.isArray(stockPayload?.variants)) return map;

    stockPayload.variants.forEach((variant) => {
      map.set(normalizeText(variant.name), variant.stock ?? null);
    });
    return map;
  }, [stockPayload]);

  const stockUpdatedAtLabel = useMemo(() => {
    if (!stockPayload?.calculated_at) return null;
    const parsedDate = new Date(stockPayload.calculated_at);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(parsedDate);
  }, [stockPayload?.calculated_at]);

  const trustItems = useMemo(
    () => [
      { Icon: CreditCard, text: t("product.trust1") },
      { Icon: Waypoints, text: t("product.trust2") },
      { Icon: RotateCcw, text: t("product.trust3") },
      { Icon: Headset, text: t("product.trust4") },
    ],
    [t]
  );
  const highlights = pageContent.highlights;
  const guaranteeItems = pageContent.guaranteeItems;
  const { effectiveRating, effectiveReviewCount } = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < product.slug.length; i++) {
      hash = product.slug.charCodeAt(i) + ((hash << 5) - hash);
    }
    const count = 8 + (Math.abs(hash) % 28);
    const ratingOptions = [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8];
    const rating = ratingOptions[Math.abs(hash) % ratingOptions.length];
    return { effectiveReviewCount: count, effectiveRating: rating };
  }, [product.slug]);

  const normalizedRating = Math.min(5, Math.max(0, effectiveRating));
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars >= 0.5 && fullStars < 5;
  const displayRating = normalizedRating.toFixed(1);
  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );
  const formattedReviewCount = new Intl.NumberFormat("es-CO").format(
    effectiveReviewCount
  );
  const formatReviewDate = (value: string): string | null => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return reviewDateFormatter.format(parsed);
  };


  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: cartImage,
      variant: variantString,
      quantity,
      freeShipping: productHasFreeShipping,
      shippingCost: product.shipping_cost ?? null,
      stockLocation: "nacional",
    });
    toast(t("cart.added"), "success");
  };

  useEffect(() => {
    let cancelled = false;

    const loadEstimate = async () => {
      setIsLoadingEstimate(true);
      try {
        const payload = await fetchDeliveryEstimateClient();

        if (cancelled) return;

        if (payload?.estimate) {
          setDeliveryEstimate({
            min: payload.estimate.minBusinessDays,
            max: payload.estimate.maxBusinessDays,
            range: payload.estimate.formattedRange,
            department: payload.estimate.department,
            city: payload.estimate.city || payload.location?.city || null,
          });
        } else {
          setDeliveryEstimate(null);
        }
      } catch {
        if (!cancelled) {
          setDeliveryEstimate(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEstimate(false);
        }
      }
    };

    const delayTimer = window.setTimeout(() => {
      void loadEstimate();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(delayTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let isFetching = false;
    const refreshIntervalMs = PRODUCT_STOCK_POLL_MS;

    const loadStock = async () => {
      if (cancelled || isFetching) return;
      isFetching = true;
      setIsLoadingStock(true);
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(product.slug)}/stock`, {
          cache: "no-store",
        });
        const data = (await response.json()) as Partial<StockPayload>;
        if (!cancelled) {
          setStockPayload({
            live: Boolean(data.live),
            total_stock:
              typeof data.total_stock === "number" || data.total_stock === null
                ? data.total_stock
                : null,
            variants: Array.isArray(data.variants) ? data.variants : [],
            message: typeof data.message === "string" ? data.message : undefined,
            calculated_at:
              typeof data.calculated_at === "string"
                ? data.calculated_at
                : new Date().toISOString(),
          });
        }
      } catch {
        if (!cancelled) {
          setStockPayload({
            live: false,
            total_stock: null,
            variants: [],
            message: "No fue posible cargar el stock en vivo en este momento.",
            calculated_at: new Date().toISOString(),
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStock(false);
        }
        isFetching = false;
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        void loadStock();
      }
    };

    const initialDelay = window.setTimeout(() => {
      void loadStock();
    }, 2000);
    const intervalId = window.setInterval(() => {
      void loadStock();
    }, refreshIntervalMs);

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      cancelled = true;
      window.clearTimeout(initialDelay);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [product.slug]);

  return (
    <>
      <div
        className="border-b bg-[var(--surface-muted)] border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav
            className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[var(--muted)]"
          >
            <Link
              href="/"
              className="transition-colors hover:text-[var(--foreground)]"
            >
              {t("common.home")}
            </Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span
              className="font-medium text-[var(--foreground)]"
            >
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <section className="py-6 sm:py-10 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
            <div>
              <div
                className="relative aspect-square rounded-[var(--card-radius)] overflow-hidden mb-3 border bg-white border-[var(--border)]"
              >
                {shouldShowOutOfStockImagePlaceholder ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-700 bg-red-50/80">
                    <PackageX className="w-24 h-24 sm:w-28 sm:h-28" />
                    <p className="text-base sm:text-lg font-bold uppercase tracking-wide">
                      {t("product.variantOutOfStockTitle")}
                    </p>
                    <p className="text-sm text-red-600">
                      {selectedColor
                        ? t("product.variantOutOfStockColor", { color: selectedColor })
                        : t("product.variantOutOfStockGeneric")}
                    </p>
                  </div>
                ) : product.images[activeImage] ? (
                  <div className="absolute inset-0">
                    <Image
                      src={product.images[activeImage]}
                      alt={`${product.name} - imagen ${activeImage + 1}`}
                      fill
                      className="object-contain p-4 sm:p-7"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                      loading="eager"
                      quality={75}
                      priority
                    />
                  </div>
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
                  {product.is_bestseller && (
                    <span className="bg-amber-400 text-amber-950 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {t("product.badgeBestseller")}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-[var(--accent)] text-[#071a0a] text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
                      -{discount}%
                    </span>
                  )}
                </div>

                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1.5 border border-emerald-200">
                  <Truck className="w-3.5 h-3.5" />
                  {productHasFreeShipping ? t("product.freeShipping") : t("product.nationalShipping")}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => {
                      setIsManualImageSelection(true);
                      setActiveImage(index);
                    }}
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 relative bg-white",
                      activeImage === index
                        ? "border-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--accent-strong)]/40"
                    )}
                    type="button"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} miniatura ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                      loading={index === activeImage ? "eager" : "lazy"}
                      quality={75}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "w-3.5 h-3.5",
                        index < fullStars
                          ? "fill-amber-400 text-amber-400"
                          : index === fullStars && hasHalfStar
                            ? "fill-amber-400/55 text-amber-400"
                            : "fill-amber-400/20 text-amber-400/35"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--muted-soft)]">
                  {t("product.ratingSummary", {
                    rating: displayRating,
                    count: formattedReviewCount,
                    reviews: t("product.reviews"),
                  })}
                </span>
              </div>

              <h1
                className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight mb-3 leading-snug text-[var(--foreground)]"
              >
                {product.name}
              </h1>



              <LiveVisitors variant="product" className="mb-4" />

              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]"
                >
                  {formatDisplayPrice(product.price)}
                </span>
                {effectiveCompareAtPrice > 0 && (
                  <>
                    <span className="text-sm sm:text-base text-[var(--muted-faint)] line-through">
                      {formatDisplayPrice(effectiveCompareAtPrice)}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full bg-[var(--accent)] text-[#071a0a] whitespace-nowrap">
                      Ahorras {formatDisplayPrice(effectiveCompareAtPrice - product.price)}
                    </span>
                  </>
                )}
              </div>
              {isDisplayDifferentFromPayment && (
                <p className="text-xs text-[var(--muted-soft)] -mt-3 mb-5">
                  {formatPaymentPrice(product.price)}
                </p>
              )}

              <ShippingBadge stockLocation={product.stock_location} className="mb-4" />

              <div
                className="rounded-[var(--card-radius)] border p-4 mb-4 bg-white border-[var(--border)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent-strong)]" />
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Disponibilidad actual
                  </p>
                </div>
                {isLoadingStock ? (
                  <p className="text-sm text-[var(--muted-soft)] min-h-[2rem]">Consultando disponibilidad...</p>
                ) : (
                  <div className="space-y-2">
                    {stockPayload?.live ? (
                      <p className="text-sm text-[var(--muted-soft)]">
                        Stock total: <span className="font-semibold text-[var(--accent-strong)]">{stockPayload.total_stock ?? "N/D"}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--muted-soft)]">
                        {stockPayload?.message || "Disponibilidad no visible en este momento."}
                      </p>
                    )}
                    {stockUpdatedAtLabel && stockPayload?.live && (
                      <p className="text-xs text-[var(--muted-soft)]">
                        {t("product.stockUpdatedLabel", { time: stockUpdatedAtLabel })}
                      </p>
                    )}
                    {Array.isArray(stockPayload?.variants) && stockPayload.variants.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {stockPayload.variants.map((variant) => {
                          const isOut = typeof variant.stock === "number" && variant.stock <= 0;
                          return (
                            <div
                              key={`${variant.name}-${variant.variation_id}`}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-xs",
                                isOut
                                  ? "border-red-200 bg-red-50"
                                  : "border-[var(--border)] bg-[var(--surface-muted)]"
                              )}
                            >
                              <p
                                className={cn(
                                  "font-semibold",
                                  isOut ? "text-red-700" : "text-[var(--foreground)]"
                                )}
                              >
                                {variant.name}
                              </p>
                              <p className={cn(isOut ? "text-red-600" : "text-[var(--muted-soft)]")}>
                                {typeof variant.stock === "number"
                                  ? variant.stock <= 0
                                    ? t("product.stockOut")
                                    : t("product.stockUnits", { count: variant.stock })
                                  : t("product.stockUnavailable")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {selectedColorStock?.stock !== null && selectedColorStock?.stock !== undefined ? (
                      <p className="text-xs text-[var(--muted-soft)]">
                        {t("product.selectedColorLabel", { color: selectedColorStock.name })}{" "}
                        <span className="font-semibold text-[var(--accent-strong)]">
                          {selectedColorStock.stock <= 0
                            ? t("product.stockOut")
                            : selectedColorStock.stock}
                        </span>
                        {selectedColorStock.stock > 0 ? ` ${t("product.stockAvailableSuffix")}` : "."}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div
                className="rounded-[var(--card-radius)] border p-4 mb-5 bg-white border-[var(--border)]"
              >
              {isLoadingEstimate ? (
                  <p className="text-sm text-[var(--muted-soft)] min-h-[4.5rem]">{t("product.estimateLoading")}</p>
                ) : deliveryEstimate ? (
                  <div className="space-y-1.5">
                    <p className="text-sm text-[var(--muted-soft)] flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
                      <span>{t("product.estimateLabel")}</span>
                      <span className="font-semibold text-[var(--accent-strong)]">
                        {deliveryEstimate.min} {t("product.estimateTo")} {deliveryEstimate.max} {t("product.estimateBusinessDays")}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--muted-soft)]">
                      {t("product.estimateZone")}{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {deliveryEstimate.city
                          ? `${deliveryEstimate.city}, ${deliveryEstimate.department}`
                          : deliveryEstimate.department}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--muted-soft)]">
                      {t("product.estimateRange")}{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {deliveryEstimate.range}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-soft)]">{t("product.estimateUnavailable")}</p>
                )}
              </div>

              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-5">
                  <label
                    className="text-sm font-semibold mb-2.5 block text-[var(--foreground)]"
                  >
                    {variant.name}:{" "}
                    <span className="font-normal text-[var(--muted-soft)]">{selectedVariants[variant.name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => {
                      const isColorVariant = normalizeText(variant.name) === "color";
                      const optionStock = stockByVariantOption.get(normalizeText(option));
                      const isOptionOutOfStock =
                        isColorVariant &&
                        typeof optionStock === "number" &&
                        optionStock <= 0;
                      return (
                        <button
                          key={option}
                          onClick={() => {
                            if (isColorVariant) {
                              setHasUserSelectedColor(true);
                              setIsManualImageSelection(false);
                            }
                            startTransition(() => {
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [variant.name]: option,
                              }));
                            });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                            selectedVariants[variant.name] === option
                              ? isOptionOutOfStock
                                ? "border-red-500 bg-red-100 text-red-800"
                                : "border-[var(--accent)] bg-[var(--accent)] text-[#071a0a]"
                              : isOptionOutOfStock
                                ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                                : "border-[var(--border)] text-[var(--muted-strong)] hover:border-[var(--accent-strong)]/40"
                          )}
                          type="button"
                        >
                          {option}
                          {isOptionOutOfStock ? t("product.optionOutOfStock") : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isSelectedColorOutOfStock && (
                <p
                  className="mb-4 text-sm rounded-xl border px-4 py-3 border-red-200 bg-red-50 text-red-700"
                >
                  {t("product.variantOutOfStockNote")}
                </p>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center border rounded-full overflow-hidden border-[var(--border)]"
                >
                  <button
                    onClick={() => startTransition(() => setQuantity(Math.max(1, quantity - 1)))}
                    disabled={isSelectedColorOutOfStock}
                    aria-label={t("product.quantityDecrease")}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center transition-colors",
                      "hover:bg-[var(--surface-muted)]",
                      isSelectedColorOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                    type="button"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => startTransition(() => setQuantity(quantity + 1))}
                    disabled={isSelectedColorOutOfStock}
                    aria-label={t("product.quantityIncrease")}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center transition-colors",
                      "hover:bg-[var(--surface-muted)]",
                      isSelectedColorOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={isSelectedColorOutOfStock}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isSelectedColorOutOfStock ? t("product.outOfStockCta") : t("product.addToCart")}
                </Button>
              </div>

              <Link href="/checkout" className="block w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full mb-1.5"
                  onClick={handleAddToCart}
                  disabled={isSelectedColorOutOfStock}
                >
                  {t("product.buyNow")}
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-soft)] mb-5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t("product.secureNotice")}</span>
                </div>
              </Link>

              {/* Contra entrega + urgency nudge */}
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--accent-strong)]/20 bg-[var(--accent-strong)]/5 px-3 py-2.5">
                  <span className="text-base leading-none">💵</span>
                  <span className="text-sm font-bold text-[var(--accent-strong)] drop-shadow-sm">
                    {t("product.codTitle")}
                  </span>
                  <span className="mx-1 text-[var(--muted-faint)]">·</span>
                  <span className="text-xs font-medium text-[var(--muted-strong)]">{t("product.codSubtitle")}</span>
                </div>
                {shouldShowUrgencyNudge && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/80 px-3 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                    </span>
                    <p className="text-xs font-semibold text-amber-900">
                      {stockPayload?.total_stock && stockPayload.total_stock <= 12
                        ? t("product.urgencyFewLeft", { count: stockPayload.total_stock })
                        : t("product.urgencyLastUnits")}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="space-y-2.5 mb-5 p-4 rounded-[var(--card-radius)] bg-[var(--surface-muted)]"
              >
                {trustItems.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 text-sm text-[var(--muted)]"
                  >
                    <item.Icon className="w-[18px] h-[18px] text-[var(--accent-strong)] shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-[11px] text-[var(--muted-faint)] mb-3 font-semibold uppercase tracking-wider">
                  {t("product.acceptedPayments")}
                </p>
                <PaymentLogos variant="dark" size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 lg:grid-cols-2">
            <div
              className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 bg-white border-[var(--border)]"
            >
              <div className="absolute -top-20 -right-16 h-44 w-44 rounded-full bg-[var(--accent)]/10 blur-2xl" />
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)] mb-3">
                <BadgeCheck className="w-3.5 h-3.5" />
                {t("product.detailsBadge")}
              </p>
              <h2
                className="text-xl font-bold mb-4 text-[var(--foreground)]"
              >
                {t("product.description")}
              </h2>
              <p className="leading-relaxed mb-5 text-[var(--muted)]">
                {product.description}
              </p>
              <p
                className="mb-5 text-sm rounded-xl border px-4 py-3 border-amber-200 bg-amber-50 text-amber-800"
              >
                {t("product.detailsNotice")}
              </p>
              <div className="space-y-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-[var(--accent-strong)] shrink-0" />
                    <span className="text-[var(--muted-strong)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 bg-white border-[var(--border)]"
            >
              <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-[var(--accent)]/10 blur-2xl" />
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)] mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("product.guaranteeBadge")}
              </p>
              <h2
                className="text-xl font-bold mb-4 text-[var(--foreground)]"
              >
                {t("product.guaranteeTitle")}
              </h2>
              <div className="space-y-3">
                {guaranteeItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border px-4 py-3 text-sm border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-12 sm:py-16 border-t bg-[var(--surface)] border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl border p-6 sm:p-7 bg-white border-[var(--border)]"
          >
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)] mb-3">
              <BadgeCheck className="w-3.5 h-3.5" />
              {t("product.reviewsBadge")}
            </p>
            <h2
              className="text-xl sm:text-2xl font-bold mb-2 text-[var(--foreground)]"
            >
              {t("product.reviewsTitle")}
            </h2>
            <p className="text-sm mb-6 text-[var(--muted)]">
              {t("product.reviewsSubtitle")}
            </p>

            {reviews.length === 0 ? (
              <p
                className="text-sm rounded-xl border px-4 py-3 border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]"
              >
                {t("product.reviewsEmpty")}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reviews.map((review) => {
                  const reviewDate = formatReviewDate(review.created_at);
                  const safeRating = Math.min(5, Math.max(1, review.rating));


                  return (
                    <article
                      key={review.id}
                      className="rounded-[var(--card-radius)] border p-4 border-[var(--border)] bg-[var(--surface-muted)]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-sm text-[var(--foreground)]">
                            {review.reviewer_name || t("product.reviewVerifiedCustomer")}
                          </p>
                          {reviewDate ? (
                            <p className="text-xs text-[var(--muted-soft)]">{reviewDate}</p>
                          ) : null}
                        </div>
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          {t("product.reviewVerifiedPurchase")}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 mb-2">
                        {[...Array(5)].map((_, starIndex) => (
                          <Star
                            key={`${review.id}-star-${starIndex}`}
                            className={cn(
                              "w-3.5 h-3.5",
                              starIndex < safeRating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-amber-400/20 text-amber-400/35"
                            )}
                          />
                        ))}
                      </div>

                      {review.title ? (
                        <p className="text-sm font-semibold mb-1 text-[var(--foreground)]">
                          {review.title}
                        </p>
                      ) : null}
                      <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                        {review.body}
                      </p>
                      {review.variant ? (
                        <p className="text-xs text-[var(--muted-soft)] mt-2">
                          {t("product.reviewVariantLabel")} {review.variant}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section
          className="py-14 sm:py-20 border-t bg-[var(--surface)] border-[var(--border)]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-2xl font-bold mb-8 text-[var(--foreground)]"
            >
              {t("product.related")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={index}
                  deliveryEstimate={relatedEstimate}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        className="py-10 border-t bg-[var(--background)] border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
