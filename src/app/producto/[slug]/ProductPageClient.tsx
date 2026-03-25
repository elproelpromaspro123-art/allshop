"use client";

import { startTransition, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
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
import { ResponsiveDisclosureSection } from "@/components/ui/ResponsiveDisclosureSection";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { fetchDeliveryEstimateClient } from "@/lib/delivery-estimate-client";
import type { ProductPageContent } from "@/lib/product-page-content";
import {
  buildColorImageIndexMap,
  buildColorImageMap,
  normalizeProductHintText as normalizeText,
} from "@/lib/product-image-hints";
import dynamic from "next/dynamic";

const ImageZoomModal = dynamic(
  () => import("@/components/ImageZoomModal").then((mod) => mod.ImageZoomModal),
  { ssr: false },
);

const ProductCard = dynamic(
  () => import("@/components/ProductCard").then((mod) => mod.ProductCard),
  {
    ssr: true,
    loading: () => (
      <div className="h-64 sm:h-[400px] w-full bg-slate-100 rounded-[1.25rem] animate-pulse" />
    ),
  },
);

import { ProductGallery } from "@/components/product/ProductGallery";
import { StockAvailabilityCard } from "@/components/product/StockAvailabilityCard";
import { DeliveryEstimateCard } from "@/components/product/DeliveryEstimateCard";
import { VariantSelector } from "@/components/product/VariantSelector";
import { CartShortcutBanner } from "@/components/product/CartShortcutBanner";
import { SharePopover } from "@/components/product/SharePopover";
import { ReviewList } from "@/components/product/ReviewList";
import { StickyBottomBar } from "@/components/product/StickyBottomBar";

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

export function ProductPageClient({
  product,
  category,
  relatedProducts,
  reviews,
  pageContent,
}: Props) {
  const router = useRouter();
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >(() => {
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
  const [showCheckoutShortcut, setShowCheckoutShortcut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const relatedEstimate = deliveryEstimate
    ? { min: deliveryEstimate.min, max: deliveryEstimate.max }
    : null;

  const addItem = useCartStore((store) => store.addItem);
  const cartItems = useCartStore((store) => store.items);
  const hasCartHydrated = useCartStore((store) => store.hasHydrated);
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
    (variant) => normalizeText(variant.name) === "color",
  );

  const selectedColor = colorVariant
    ? selectedVariants[colorVariant.name]
    : null;

  const imageByColor = useMemo(() => {
    if (!colorVariant) return new Map<string, string | null>();
    return buildColorImageMap({
      productSlug: product.slug,
      images: product.images,
      options: colorVariant.options,
    });
  }, [colorVariant, product.images, product.slug]);

  const imageIndexByColor = useMemo(() => {
    if (!colorVariant) return new Map<string, number | null>();
    return buildColorImageIndexMap({
      productSlug: product.slug,
      images: product.images,
      options: colorVariant.options,
    });
  }, [colorVariant, product.images, product.slug]);

  const activeImagePath =
    product.images[activeImage] || product.images[0] || "";
  const cartImage = isManualImageSelection
    ? activeImagePath
    : selectedColor
      ? imageByColor.get(normalizeText(selectedColor)) || activeImagePath
      : activeImagePath;
  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const hasStableCartShortcut = isMounted && hasCartHydrated && cartItemCount > 0;
  const shouldPrioritizeCheckoutShortcut =
    hasStableCartShortcut && showCheckoutShortcut;
  const videoSource = product.video_url
    ? product.video_url.startsWith("/")
      ? product.video_url
      : `/${product.video_url}`
    : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedColor || !hasUserSelectedColor || isManualImageSelection)
      return;
    const targetIndex = imageIndexByColor.get(normalizeText(selectedColor));
    if (typeof targetIndex === "number" && targetIndex !== activeImage) {
      setActiveImage(targetIndex);
    }
  }, [
    activeImage,
    hasUserSelectedColor,
    imageIndexByColor,
    isManualImageSelection,
    selectedColor,
  ]);

  const selectedColorStock = useMemo(() => {
    if (!selectedColor) return null;
    const variants = Array.isArray(stockPayload?.variants)
      ? stockPayload.variants
      : [];
    if (variants.length === 0) return null;
    return (
      variants.find(
        (item) => normalizeText(item.name) === normalizeText(selectedColor),
      ) || null
    );
  }, [selectedColor, stockPayload]);
  const isSelectedColorOutOfStock =
    typeof selectedColorStock?.stock === "number" &&
    selectedColorStock.stock <= 0;
  const shouldShowOutOfStockImagePlaceholder =
    Boolean(selectedColor) && isSelectedColorOutOfStock;

  const shouldShowUrgencyNudge = useMemo(() => {
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
      {
        Icon: CreditCard,
        text: t("product.trust1"),
        color: "bg-emerald-50 text-emerald-600",
      },
      {
        Icon: Waypoints,
        text: t("product.trust2"),
        color: "bg-indigo-50 text-indigo-600",
      },
      {
        Icon: RotateCcw,
        text: t("product.trust3"),
        color: "bg-amber-50 text-amber-600",
      },
      {
        Icon: Headset,
        text: t("product.trust4"),
        color: "bg-purple-50 text-purple-600",
      },
    ],
    [t],
  );
  const highlights = pageContent.highlights;
  const guaranteeItems = pageContent.guaranteeItems;
  const effectiveRating = product.average_rating || 0;
  const effectiveReviewCount = product.reviews_count || 0;

  const normalizedRating = Math.min(5, Math.max(0, effectiveRating));
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars >= 0.5 && fullStars < 5;
  const displayRating = normalizedRating.toFixed(1);
  const formattedReviewCount = useMemo(
    () => new Intl.NumberFormat("es-CO").format(effectiveReviewCount),
    [effectiveReviewCount],
  );

  const handleAddToCart = useCallback(
    (options?: { openCheckout?: boolean }) => {
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
      setShowCheckoutShortcut(true);
      toast(
        t("cart.added"),
        "success",
        "Puedes cerrar el pedido desde el atajo inferior sin volver al header.",
      );
      if (options?.openCheckout) {
        router.push("/checkout");
      }
    },
    [
      addItem,
      cartImage,
      product,
      productHasFreeShipping,
      quantity,
      router,
      t,
      toast,
      variantString,
    ],
  );

  useEffect(() => {
    if (!showCheckoutShortcut) return;
    const timer = window.setTimeout(() => {
      setShowCheckoutShortcut(false);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [showCheckoutShortcut]);

  useEffect(() => {
    if (cartItemCount === 0 && showCheckoutShortcut) {
      setShowCheckoutShortcut(false);
    }
  }, [cartItemCount, showCheckoutShortcut]);

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
        if (!cancelled) setDeliveryEstimate(null);
      } finally {
        if (!cancelled) setIsLoadingEstimate(false);
      }
    };
    const delayTimer = window.setTimeout(() => void loadEstimate(), 1500);
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
        const response = await fetch(
          `/api/products/${encodeURIComponent(product.slug)}/stock`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as Partial<StockPayload>;
        if (!cancelled) {
          setStockPayload({
            live: Boolean(data.live),
            total_stock:
              typeof data.total_stock === "number" || data.total_stock === null
                ? data.total_stock
                : null,
            variants: Array.isArray(data.variants) ? data.variants : [],
            message:
              typeof data.message === "string" ? data.message : undefined,
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
        if (!cancelled) setIsLoadingStock(false);
        isFetching = false;
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) void loadStock();
    };

    const initialDelay = window.setTimeout(() => void loadStock(), 2000);
    const intervalId = window.setInterval(() => void loadStock(), refreshIntervalMs);
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
      <div className="breadcrumb-container bg-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-gray-500">
            <Link href="/" className="transition-colors hover:text-gray-900 font-medium">
              {t("common.home")}
            </Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="transition-colors hover:text-gray-900"
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="font-medium text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <section
        className="py-12 sm:py-16 bg-gray-50"
        data-density="balanced"
        data-tone="mist"
        style={{ overflow: "visible" }}
      >
        <div className="max-w-7xl mx-auto px-4 pb-24 sm:px-6 sm:pb-0 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-start">
            <ProductGallery
              images={product.images}
              productName={product.name}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
              setIsManualImageSelection={setIsManualImageSelection}
              discount={discount}
              productHasFreeShipping={productHasFreeShipping}
              shouldShowOutOfStockImagePlaceholder={
                shouldShowOutOfStockImagePlaceholder
              }
              selectedColor={selectedColor}
              videoSource={videoSource}
              isZoomModalOpen={isZoomModalOpen}
              setIsZoomModalOpen={setIsZoomModalOpen}
              ImageZoomModal={ImageZoomModal}
            />

            <div className="flex flex-col" data-testid="product-purchase-panel">
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
                            : "fill-amber-400/20 text-amber-400/35",
                      )}
                    />
                  ))}
                </div>
                <span suppressHydrationWarning className="text-xs text-gray-400">
                  {t("product.ratingSummary", {
                    rating: displayRating,
                    count: formattedReviewCount,
                    reviews: t("product.reviews"),
                  })}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 mb-3">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight leading-snug text-gray-900">
                  {product.name}
                </h1>
                <SharePopover
                  productName={product.name}
                  productPrice={formatDisplayPrice(product.price)}
                />
              </div>

              <LiveVisitors variant="product" className="mb-4" />

              <div className="flex items-baseline gap-3 mb-5">
                <span suppressHydrationWarning className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatDisplayPrice(product.price)}
                </span>
                {effectiveCompareAtPrice > 0 && (
                  <>
                    <span suppressHydrationWarning className="text-sm sm:text-base text-gray-300 line-through">
                      {formatDisplayPrice(effectiveCompareAtPrice)}
                    </span>
                    <span suppressHydrationWarning className="px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full bg-emerald-500 text-[#071a0a] whitespace-nowrap">
                      Ahorras{" "}
                      {formatDisplayPrice(effectiveCompareAtPrice - product.price)}
                    </span>
                  </>
                )}
              </div>
              {isDisplayDifferentFromPayment && (
                <p suppressHydrationWarning className="text-xs text-gray-400 -mt-3 mb-5">
                  {formatPaymentPrice(product.price)}
                </p>
              )}

              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3 py-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-medium text-emerald-800">
                  Pagas cuando recibes en tu puerta · Sin tarjeta necesaria
                </p>
              </div>

              <ShippingBadge stockLocation={product.stock_location} className="mb-4" />

              <StockAvailabilityCard
                isLoadingStock={isLoadingStock}
                stockPayload={stockPayload}
                stockUpdatedAtLabel={stockUpdatedAtLabel}
                selectedColorStock={selectedColorStock}
              />

              <DeliveryEstimateCard
                isLoadingEstimate={isLoadingEstimate}
                deliveryEstimate={deliveryEstimate}
              />

              <VariantSelector
                variants={product.variants}
                selectedVariants={selectedVariants}
                setSelectedVariants={setSelectedVariants}
                stockByVariantOption={stockByVariantOption}
                isSelectedColorOutOfStock={isSelectedColorOutOfStock}
                onColorSelect={() => {
                  setHasUserSelectedColor(true);
                  setIsManualImageSelection(false);
                }}
              />

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border rounded-full overflow-hidden border-gray-200">
                  <button
                    onClick={() =>
                      startTransition(() =>
                        setQuantity(Math.max(1, quantity - 1)),
                      )
                    }
                    disabled={isSelectedColorOutOfStock}
                    aria-label={t("product.quantityDecrease")}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center transition-colors",
                      "hover:bg-gray-100",
                      isSelectedColorOutOfStock && "opacity-50 cursor-not-allowed",
                    )}
                    type="button"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      startTransition(() => setQuantity(quantity + 1))
                    }
                    disabled={isSelectedColorOutOfStock}
                    aria-label={t("product.quantityIncrease")}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center transition-colors",
                      "hover:bg-gray-100",
                      isSelectedColorOutOfStock && "opacity-50 cursor-not-allowed",
                    )}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => handleAddToCart({ openCheckout: true })}
                  disabled={isSelectedColorOutOfStock}
                  data-testid="product-buy-now-desktop"
                >
                  <ChevronRight className="w-4 h-4" />
                  {isSelectedColorOutOfStock
                    ? t("product.outOfStockCta")
                    : t("product.buyNow")}
                </Button>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full mb-1.5 gap-2"
                onClick={() => handleAddToCart()}
                disabled={isSelectedColorOutOfStock}
                type="button"
                data-testid="product-add-to-cart-desktop"
              >
                <ShoppingBag className="w-4 h-4" />
                {t("product.addToCart")}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-5">
                <Lock className="w-3.5 h-3.5" />
                <span>{t("product.secureNotice")}</span>
              </div>

              {effectiveReviewCount > 0 && (
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(Math.min(5, fullStars))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span suppressHydrationWarning className="text-xs text-gray-400">
                    {formattedReviewCount} compradores verificados
                  </span>
                </div>
              )}

              {hasStableCartShortcut && (
                <CartShortcutBanner
                  showCheckoutShortcut={showCheckoutShortcut}
                  setShowCheckoutShortcut={setShowCheckoutShortcut}
                  cartItemCount={cartItemCount}
                  cartTotal={cartTotal}
                  formatDisplayPrice={formatDisplayPrice}
                  router={router}
                />
              )}

              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-700/20 bg-emerald-700/5 px-3 py-2.5">
                  <span className="text-base leading-none">💵</span>
                  <span className="text-sm font-bold text-emerald-700 drop-shadow-sm">
                    {t("product.codTitle")}
                  </span>
                  <span className="mx-1 text-gray-300">·</span>
                  <span className="text-xs font-medium text-gray-700">
                    {t("product.codSubtitle")}
                  </span>
                </div>
                {shouldShowUrgencyNudge && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/80 px-3 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                    </span>
                    <p className="text-xs font-semibold text-amber-900">
                      {stockPayload?.total_stock && stockPayload.total_stock <= 12
                        ? t("product.urgencyFewLeft", {
                            count: stockPayload.total_stock,
                          })
                        : t("product.urgencyLastUnits")}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 mb-5 p-4 sm:p-5 rounded-3xl bg-gray-100 border border-gray-100">
                {trustItems.map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-sm text-gray-500">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.Icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-[11px] text-gray-300 mb-3 font-semibold uppercase tracking-wider">
                  {t("product.acceptedPayments")}
                </p>
                <PaymentLogos variant="dark" size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-20 grid gap-6 lg:grid-cols-2">
            <ResponsiveDisclosureSection
              badge={
                <p className="section-badge">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {t("product.detailsBadge")}
                </p>
              }
              title={t("product.description")}
              description="Ficha compacta con puntos clave y contexto de uso antes de comprar."
              defaultOpen
              className="panel-surface"
            >
              <div className="relative p-6 sm:p-8">
                <div className="absolute -top-20 -right-16 h-44 w-44 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
                <p className="leading-relaxed mb-5 text-gray-500">
                  {product.description}
                </p>
                <p className="mb-5 text-sm rounded-xl border px-4 py-3 border-amber-200 bg-amber-50 text-amber-800">
                  {t("product.detailsNotice")}
                </p>
                <div className="space-y-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ResponsiveDisclosureSection>

            <ResponsiveDisclosureSection
              badge={
                <p className="section-badge">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t("product.guaranteeBadge")}
                </p>
              }
              title={t("product.guaranteeTitle")}
              description="Garantías y soporte visibles sin sumar ruido en la parte alta de la ficha."
              className="panel-surface"
            >
              <div className="relative p-6 sm:p-8">
                <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
                <div className="space-y-3">
                  {guaranteeItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border px-4 py-3 text-sm border-gray-200 bg-gray-100 text-gray-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </ResponsiveDisclosureSection>
          </div>
        </div>
      </section>

      <section
        className="py-12 sm:py-16 border-t bg-gray-50 border-gray-200"
        data-density="compact"
        data-tone="base"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ResponsiveDisclosureSection
            badge={
              <p className="section-badge">
                <BadgeCheck className="w-3.5 h-3.5" />
                {t("product.reviewsBadge")}
              </p>
            }
            title={t("product.reviewsTitle")}
            description={t("product.reviewsSubtitle")}
            className="bento-card"
          >
            <div className="p-6 sm:p-8">
              <ReviewList reviews={reviews} />
            </div>
          </ResponsiveDisclosureSection>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section
          className="py-12 sm:py-16 border-t bg-gray-50 border-gray-200"
          data-density="compact"
          data-tone="contrast"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="section-badge mb-3">{t("product.related")}</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-gray-900">
                {t("product.relatedTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        className="py-12 sm:py-16 border-t bg-gray-50 border-gray-200"
        data-density="compact"
        data-tone="base"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>

      <StickyBottomBar
        productPrice={product.price}
        quantity={quantity}
        productHasFreeShipping={productHasFreeShipping}
        hasStableCartShortcut={hasStableCartShortcut}
        shouldPrioritizeCheckoutShortcut={shouldPrioritizeCheckoutShortcut}
        showCheckoutShortcut={showCheckoutShortcut}
        setShowCheckoutShortcut={setShowCheckoutShortcut}
        isSelectedColorOutOfStock={isSelectedColorOutOfStock}
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        formatDisplayPrice={formatDisplayPrice}
        onAddToCart={handleAddToCart}
        router={router}
      />
    </>
  );
}
