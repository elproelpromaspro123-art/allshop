"use client";

import { startTransition, useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Clock3,
  ShieldCheck,
  Truck,
  CheckCircle2,
  BadgeCheck,
  PackageX,
  Lock,
  Share2,
  Copy,
  Check,
  ZoomIn,
  PlayCircle,
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

const ImageZoomModal = dynamic(() => import("@/components/ImageZoomModal").then((mod) => mod.ImageZoomModal), {
  ssr: false,
});

const ProductCard = dynamic(() => import("@/components/ProductCard").then((mod) => mod.ProductCard), {
  ssr: true,
  loading: () => <div className="h-64 sm:h-[400px] w-full bg-slate-100 rounded-[1.25rem] animate-pulse" />
});

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
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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
    setVideoUnavailable(false);
  }, [videoSource]);

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
  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );
  const formattedReviewCount = useMemo(
    () => new Intl.NumberFormat("es-CO").format(effectiveReviewCount),
    [effectiveReviewCount],
  );
  const formatReviewDate = (value: string): string | null => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return reviewDateFormatter.format(parsed);
  };

  const handleAddToCart = (options?: { openCheckout?: boolean }) => {
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
  };

  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleShareWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${product.name} - ${formatDisplayPrice(product.price)}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setShareOpen(false);
  };

  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  }, []);

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
      setShareOpen(false);
    }, 1500);
  };

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
        const response = await fetch(
          `/api/products/${encodeURIComponent(product.slug)}/stock`,
          {
            cache: "no-store",
          },
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
      <div className="breadcrumb-container bg-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-gray-500">
            <Link
              href="/"
              className="transition-colors hover:text-gray-900 font-medium"
            >
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
            <span className="font-medium text-gray-900">
              {product.name}
            </span>
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
            <div className="z-10 flex flex-col gap-4 lg:sticky lg:top-24">
              <div 
                ref={imageContainerRef}
                className="group/img relative mb-3 aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-sm cursor-zoom-in"
                onMouseMove={handleImageMouseMove}
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => {
                  setIsHoveringImage(false);
                  setMousePosition({ x: 50, y: 50 });
                }}
                onClick={() => setIsZoomModalOpen(true)}
              >
                {shouldShowOutOfStockImagePlaceholder ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-700 bg-red-50/80">
                    <PackageX className="w-24 h-24 sm:w-28 sm:h-28" />
                    <p className="text-base sm:text-lg font-bold uppercase tracking-wide">
                      {t("product.variantOutOfStockTitle")}
                    </p>
                    <p className="text-sm text-red-600">
                      {selectedColor
                        ? t("product.variantOutOfStockColor", {
                            color: selectedColor,
                          })
                        : t("product.variantOutOfStockGeneric")}
                    </p>
                  </div>
                ) : product.images[activeImage] ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,247,250,0.36))]" />
                    <Image
                      src={product.images[activeImage]}
                      alt={`${product.name} - imagen ${activeImage + 1}`}
                      fill
                      className="object-contain p-4 transition-transform duration-200 ease-out sm:p-6 md:p-7"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                      loading="eager"
                      quality={75}
                      style={{
                        transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        transform: isHoveringImage ? "scale(1.8)" : "scale(1)",
                      }}
                    />
                    {/* Zoom indicator */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white">
                        <ZoomIn className="w-3.5 h-3.5" />
                        Zoom
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
                  {product.is_bestseller && (
                    <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-amber-950 shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
                      {t("product.badgeBestseller")}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-[#071a0a] shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
                      -{discount}%
                    </span>
                  )}
                </div>

                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1.5 sm:text-xs">
                  <Truck className="w-3.5 h-3.5" />
                  {productHasFreeShipping
                    ? t("product.freeShipping")
                    : t("product.nationalShipping")}
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
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-white to-gray-50 transition-all sm:h-20 sm:w-20",
                      activeImage === index
                        ? "border-emerald-500"
                        : "border-gray-200 hover:border-emerald-700/40",
                    )}
                    type="button"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} miniatura ${index + 1}`}
                      fill
                      className="object-contain p-1.5 sm:p-2"
                      sizes="80px"
                      loading={index === activeImage ? "eager" : "lazy"}
                      quality={75}
                    />
                  </button>
                ))}
              </div>

              {videoSource ? (
                <div className="overflow-hidden rounded-[1.35rem] border border-gray-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2 text-white">
                      <PlayCircle className="h-4 w-4 text-emerald-300" />
                      <p className="text-sm font-semibold">Video del producto</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/72">
                      Vista real
                    </span>
                  </div>
                  <div className="p-3 sm:p-4">
                    {!videoUnavailable ? (
                      <div className="overflow-hidden rounded-[1.1rem] border border-white/10 bg-black shadow-[0_18px_42px_rgba(0,0,0,0.3)]">
                      <video
                        className="aspect-[4/5] w-full bg-black object-cover sm:aspect-video"
                        controls
                        controlsList="nodownload"
                        playsInline
                        preload="none"
                        poster={product.images[0] || undefined}
                        onError={() => setVideoUnavailable(true)}
                        src={videoSource}
                      >
                      </video>
                      </div>
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center rounded-[1.1rem] border border-dashed border-white/15 bg-white/[0.04] px-5 text-center sm:aspect-video">
                        <div className="max-w-xs">
                          <PlayCircle className="mx-auto h-10 w-10 text-emerald-300" />
                          <p className="mt-3 text-sm font-semibold text-white">
                            Video temporalmente no disponible
                          </p>
                          <p className="mt-2 text-sm leading-7 text-white/70">
                            Usa la galería de imágenes mientras restauramos esta vista.
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      Mira el acabado, el tamaño y la presencia real del producto antes de pedirlo.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

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
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShareOpen(!shareOpen)}
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-emerald-700/40 hover:shadow-sm transition-all"
                    aria-label={
                      t("product.share") !== "product.share"
                        ? t("product.share")
                        : "Compartir"
                    }
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {shareOpen && (
                    <div className="absolute right-0 top-11 z-20 rounded-xl border border-gray-100 bg-white shadow-xl p-2 w-48 animate-fade-in-up">
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          W
                        </span>
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopyLink()}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 ml-1" />
                            <span className="text-emerald-700 font-medium">
                              ¡Copiado!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-gray-500 ml-1" />
                            <span>Copiar enlace</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
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
                      {formatDisplayPrice(
                        effectiveCompareAtPrice - product.price,
                      )}
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

              <ShippingBadge
                stockLocation={product.stock_location}
                className="mb-4"
              />

              <div className="rounded-3xl border p-4 sm:p-5 mb-4 bg-white border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Disponibilidad actual
                  </p>
                </div>
                {isLoadingStock ? (
                  <p className="text-sm text-gray-400 min-h-[2rem]">
                    Consultando disponibilidad...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stockPayload?.live ? (
                      <p className="text-sm text-gray-400">
                        Stock total:{" "}
                        <span className="font-semibold text-emerald-700">
                          {stockPayload.total_stock ?? "N/D"}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        {stockPayload?.message ||
                          "Disponibilidad no visible en este momento."}
                      </p>
                    )}
                    {stockUpdatedAtLabel && stockPayload?.live && (
                      <p suppressHydrationWarning className="text-xs text-gray-400">
                        {t("product.stockUpdatedLabel", {
                          time: stockUpdatedAtLabel,
                        })}
                      </p>
                    )}
                    {Array.isArray(stockPayload?.variants) &&
                      stockPayload.variants.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {stockPayload.variants.map((variant) => {
                            const isOut =
                              typeof variant.stock === "number" &&
                              variant.stock <= 0;
                            return (
                              <div
                                key={`${variant.name}-${variant.variation_id}`}
                                className={cn(
                                  "rounded-xl border px-3 py-2 text-xs",
                                  isOut
                                    ? "border-red-200 bg-red-50"
                                    : "border-gray-200 bg-gray-100",
                                )}
                              >
                                <p
                                  className={cn(
                                    "font-semibold",
                                    isOut
                                      ? "text-red-700"
                                      : "text-gray-900",
                                  )}
                                >
                                  {variant.name}
                                </p>
                                <p
                                  className={cn(
                                    isOut
                                      ? "text-red-600"
                                      : "text-gray-400",
                                  )}
                                >
                                  {typeof variant.stock === "number"
                                    ? variant.stock <= 0
                                      ? t("product.stockOut")
                                      : t("product.stockUnits", {
                                          count: variant.stock,
                                        })
                                    : t("product.stockUnavailable")}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    {selectedColorStock?.stock !== null &&
                    selectedColorStock?.stock !== undefined ? (
                      <p className="text-xs text-gray-400">
                        {t("product.selectedColorLabel", {
                          color: selectedColorStock.name,
                        })}{" "}
                        <span className="font-semibold text-emerald-700">
                          {selectedColorStock.stock <= 0
                            ? t("product.stockOut")
                            : selectedColorStock.stock}
                        </span>
                        {selectedColorStock.stock > 0
                          ? ` ${t("product.stockAvailableSuffix")}`
                          : "."}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border p-4 sm:p-5 mb-5 bg-white border-gray-200 shadow-sm">
                {isLoadingEstimate ? (
                  <p className="text-sm text-gray-400 min-h-[4.5rem]">
                    {t("product.estimateLoading")}
                  </p>
                ) : deliveryEstimate ? (
                  <div className="space-y-1.5">
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Clock3 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t("product.estimateLabel")}</span>
                      <span className="font-semibold text-emerald-700">
                        {deliveryEstimate.min} {t("product.estimateTo")}{" "}
                        {deliveryEstimate.max}{" "}
                        {t("product.estimateBusinessDays")}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("product.estimateZone")}{" "}
                      <span className="font-semibold text-gray-900">
                        {deliveryEstimate.city
                          ? `${deliveryEstimate.city}, ${deliveryEstimate.department}`
                          : deliveryEstimate.department}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("product.estimateRange")}{" "}
                      <span className="font-semibold text-gray-900">
                        {deliveryEstimate.range}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    {t("product.estimateUnavailable")}
                  </p>
                )}
              </div>

              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-5">
                  <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                    {variant.name}:{" "}
                    <span className="font-normal text-gray-400">
                      {selectedVariants[variant.name]}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => {
                      const isColorVariant =
                        normalizeText(variant.name) === "color";
                      const optionStock = stockByVariantOption.get(
                        normalizeText(option),
                      );
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
                                : "border-emerald-500 bg-emerald-500 text-[#071a0a]"
                              : isOptionOutOfStock
                                ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                                : "border-gray-200 text-gray-700 hover:border-emerald-700/40",
                          )}
                          type="button"
                        >
                          {option}
                          {isOptionOutOfStock
                            ? t("product.optionOutOfStock")
                            : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isSelectedColorOutOfStock && (
                <p className="mb-4 text-sm rounded-xl border px-4 py-3 border-red-200 bg-red-50 text-red-700">
                  {t("product.variantOutOfStockNote")}
                </p>
              )}

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
                      isSelectedColorOutOfStock &&
                        "opacity-50 cursor-not-allowed",
                    )}
                    type="button"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span
                    className="w-10 text-center text-sm font-semibold"
                    aria-live="polite"
                  >
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
                      isSelectedColorOutOfStock &&
                        "opacity-50 cursor-not-allowed",
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

              {hasStableCartShortcut ? (
                <div
                  suppressHydrationWarning
                  className={cn(
                    "mb-5 rounded-xl border px-4 py-4",
                    showCheckoutShortcut
                      ? "border-emerald-300 bg-emerald-50/90"
                      : "border-gray-200 bg-gray-100/65",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {showCheckoutShortcut
                          ? "Producto en tu bolsa"
                          : "Tu bolsa ya está lista"}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-gray-500">
                        {cartItemCount} {cartItemCount === 1 ? "producto" : "productos"} · {formatDisplayPrice(cartTotal)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {showCheckoutShortcut ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCheckoutShortcut(false)}
                          type="button"
                        >
                          Seguir viendo
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => router.push("/checkout")}
                        type="button"
                        data-testid="product-checkout-shortcut"
                      >
                        <ChevronRight className="w-4 h-4" />
                        {showCheckoutShortcut ? "Ir al checkout" : "Ver bolsa"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Contra entrega + urgency nudge */}
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
                      {stockPayload?.total_stock &&
                      stockPayload.total_stock <= 12
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
                  <div
                    key={item.text}
                    className="flex items-center gap-2.5 text-sm text-gray-500"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}
                    >
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
              {reviews.length === 0 ? (
                <p className="text-sm rounded-xl border px-4 py-3 border-gray-200 bg-gray-100 text-gray-700">
                  {t("product.reviewsEmpty")}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((review) => {
                    const reviewDate = formatReviewDate(review.created_at);
                    const safeRating = Math.min(5, Math.max(1, review.rating));

                    return (
                      <article
                        key={review.id}
                        className="review-card relative quote-decoration"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-white shadow-sm">
                                {(review.reviewer_name || "C").charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-900">
                                  {review.reviewer_name ||
                                    t("product.reviewVerifiedCustomer")}
                                </p>
                                {reviewDate ? (
                                  <p suppressHydrationWarning className="text-xs text-gray-400">
                                    {reviewDate}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
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
                                  : "fill-amber-400/20 text-amber-400/35",
                              )}
                            />
                          ))}
                        </div>

                        {review.title ? (
                          <p className="text-sm font-semibold mb-1 text-gray-900">
                            {review.title}
                          </p>
                        ) : null}
                        <p className="text-sm leading-relaxed text-gray-700">
                          {review.body}
                        </p>
                        {review.variant ? (
                          <p className="text-xs text-gray-400 mt-2">
                            {t("product.reviewVariantLabel")} {review.variant}
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
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

      {/* Image Zoom Modal */}
      {product.images[activeImage] && (
        <ImageZoomModal
          src={product.images[activeImage]}
          alt={`${product.name} - imagen ${activeImage + 1}`}
          open={isZoomModalOpen}
          onClose={() => setIsZoomModalOpen(false)}
        />
      )}

      {/* Sticky Bottom Add to Cart (Mobile Only) */}
      <div
        data-testid="product-sticky-bar"
        className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-[rgba(8,19,15,0.92)] p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] text-white backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.16)] sm:hidden animate-fade-in-up"
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/85">
              {shouldPrioritizeCheckoutShortcut
                ? "Bolsa lista · Ir al checkout"
                : productHasFreeShipping
                  ? "Envío gratis · Compra directa"
                  : "Contra entrega · Compra directa"}
            </p>
            <p suppressHydrationWarning className="truncate text-base font-bold text-white">
              {shouldPrioritizeCheckoutShortcut
                ? `${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"} · ${formatDisplayPrice(cartTotal)}`
                : formatDisplayPrice(product.price * quantity)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {hasStableCartShortcut ? (
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
                onClick={
                  showCheckoutShortcut
                    ? () => setShowCheckoutShortcut(false)
                    : () => router.push("/checkout")
                }
                type="button"
                data-testid="product-sticky-bag-shortcut"
              >
                {showCheckoutShortcut ? "Seguir" : "Ver bolsa"}
              </Button>
            ) : null}

            <Button
              size="sm"
              className="gap-2 shadow-[0_8px_20px_rgba(0,190,110,0.25)]"
              onClick={
                shouldPrioritizeCheckoutShortcut
                  ? () => router.push("/checkout")
                  : () => handleAddToCart({ openCheckout: true })
              }
              disabled={
                shouldPrioritizeCheckoutShortcut
                  ? false
                  : isSelectedColorOutOfStock
              }
              type="button"
              data-testid="product-sticky-primary"
            >
              <ChevronRight className="w-4 h-4" />
              {shouldPrioritizeCheckoutShortcut
                ? "Ir al checkout"
                : isSelectedColorOutOfStock
                  ? t("product.outOfStockCta")
                  : t("product.buyNow")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
