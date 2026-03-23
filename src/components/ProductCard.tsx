"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { calculateDiscount, cn } from "@/lib/utils";
import { isProductShippingFree } from "@/lib/shipping";
import { normalizeLegacyImagePath } from "@/lib/image-paths";
import { getEffectiveCompareAtPrice } from "@/lib/promo-pricing";
import { isProductLowStockBadgeVisible } from "@/lib/product-stock";
import { Button } from "./ui/Button";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import type { DeliveryEstimateRange } from "@/lib/use-delivery-estimate";

interface ProductCardProps {
  product: Product;
  index?: number;
  enableImageRotation?: boolean;
  deliveryEstimate?: DeliveryEstimateRange | null;
}

export const ProductCard = memo(
  function ProductCardComponent({
    product,
    index = 0,
    enableImageRotation = true,
    deliveryEstimate = null,
  }: ProductCardProps) {
    const router = useRouter();
    const addItem = useCartStore((store) => store.addItem);
    const { toast } = useToast();
    const { t } = useLanguage();
    const { formatDisplayPrice } = usePricing();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [addedItemId, setAddedItemId] = useState<string | null>(null);

    const requiresVariantSelection = product.variants.some(
      (variant) => variant.options.length > 1,
    );
    const normalizedImages = useMemo(
      () => product.images.map((image) => normalizeLegacyImagePath(image)),
      [product.images],
    );
    const productHasFreeShipping = isProductShippingFree({
      id: product.id,
      slug: product.slug,
      free_shipping: product.free_shipping ?? null,
    });

    const effectiveCompareAtPrice = getEffectiveCompareAtPrice(product);
    const discount = calculateDiscount(product.price, effectiveCompareAtPrice);
    const rating = product.average_rating || 0;
    const coverImage =
      normalizedImages[activeImageIndex] || normalizedImages[0] || "";
    const isSpotlightProduct = product.slug === "airpods-pro-3";
    const componentKey = `${product.id}:${product.slug}`;
    const deliveryLine = deliveryEstimate
      ? `Llega ${deliveryEstimate.min}-${deliveryEstimate.max} días`
      : "Entrega nacional";
    const socialLine =
      product.reviews_count && product.reviews_count > 0
        ? `${product.reviews_count} reseñas`
        : productHasFreeShipping
          ? "Pago al recibir"
          : null;

    const isLowStock = isProductLowStockBadgeVisible({
      slug: product.slug,
      total_stock: product.total_stock ?? null,
    });

    useEffect(() => {
      if (!enableImageRotation || normalizedImages.length <= 1) return;
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const interval = isHovered ? 2600 : 4200;
      const timer = window.setInterval(() => {
        if (typeof document !== "undefined" && !document.hidden) {
          setActiveImageIndex(
            (previous) => (previous + 1) % normalizedImages.length,
          );
        }
      }, interval);

      return () => window.clearInterval(timer);
    }, [enableImageRotation, normalizedImages.length, isHovered]);

    const handleAddToCart = () => {
      const cartImage =
        coverImage || normalizeLegacyImagePath(product.images[0] ?? "");
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: cartImage,
        variant: null,
        quantity: 1,
        freeShipping: productHasFreeShipping,
        shippingCost: product.shipping_cost ?? null,
        stockLocation: "nacional",
      });
      setAddedItemId(product.id);
      setTimeout(() => setAddedItemId(null), 700);
      toast(
        t("cart.added"),
        "success",
        "Puedes abrir tu pedido desde el atajo inferior sin volver al header.",
      );
    };

    const handleBuyNow = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleAddToCart();
      router.push("/checkout");
    };

    const handlePrimaryAction = (
      event: React.MouseEvent<HTMLButtonElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (requiresVariantSelection) {
        router.push(`/producto/${product.slug}`);
        return;
      }

      handleAddToCart();
    };

    return (
      <div
        key={componentKey}
        className="group animate-fade-in-up h-full"
        style={{ animationDelay: `${index * 0.05}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <article
          className={cn(
            "product-surface relative flex h-full flex-col overflow-hidden",
            isSpotlightProduct &&
              "border-emerald-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_22px_58px_rgba(0,184,125,0.14)]",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="relative">
              <Link
                href={`/producto/${product.slug}`}
                className="block rounded-t-[1.6rem] rounded-b-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                aria-label={product.name}
              >
                <div
                  className={cn(
                    "relative mx-2 mt-2 aspect-square overflow-hidden rounded-[var(--product-image-radius-xl)] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(243,246,251,0.92)_55%,rgba(232,240,235,0.82))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:mx-3 sm:mt-3",
                    isSpotlightProduct &&
                      "border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(236,253,245,0.96)_48%,rgba(217,249,239,0.84))]",
                  )}
                >
                  <div className="pointer-events-none absolute inset-2 rounded-[var(--product-image-radius-lg)] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18))] sm:inset-3" />
                  <div className="absolute inset-x-2 top-2 z-[6] flex items-start justify-between gap-1.5 sm:inset-x-3 sm:top-3">
                    <div className="flex max-w-[62%] flex-wrap gap-1 sm:max-w-[70%] sm:gap-1.5">
                      {product.is_bestseller && (
                        <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-[#111827]/84 px-1.5 text-[8px] font-semibold leading-none tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(17,24,39,0.18)] backdrop-blur sm:min-h-7 sm:px-2.5 sm:text-[10px]">
                          <Star className="h-3 w-3 fill-current" />
                          {t("productCard.bestseller")}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-amber-300/92 px-1.5 text-[8px] font-semibold leading-none tracking-[0.02em] text-[#3f2b00] shadow-[0_8px_18px_rgba(245,158,11,0.14)] backdrop-blur sm:min-h-7 sm:px-2.5 sm:text-[10px]">
                          <Zap className="h-3 w-3" />
                          -{discount}%
                        </span>
                      )}
                      {isLowStock && (
                        <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-orange-500/92 px-1.5 text-[8px] font-semibold leading-none tracking-[0.02em] text-white shadow-[0_8px_18px_rgba(249,115,22,0.14)] backdrop-blur sm:min-h-7 sm:px-2.5 sm:text-[10px]">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                          </span>
                          Poco Stock
                        </span>
                      )}
                    </div>

                    {productHasFreeShipping && (
                      <span className="inline-flex min-h-6 max-w-[34%] items-center gap-1 rounded-full border border-emerald-200/70 bg-white/92 px-1.5 text-[8px] font-semibold leading-none text-emerald-800 shadow-[0_8px_18px_rgba(16,185,129,0.1)] backdrop-blur sm:min-h-7 sm:max-w-none sm:px-2.5 sm:text-[10px]">
                        <Truck className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {t("productCard.freeShipping")}
                        </span>
                        <span className="sm:hidden">Gratis</span>
                      </span>
                    )}
                  </div>

                  {coverImage ? (
                    <div className="relative z-[1] h-full w-full overflow-hidden rounded-[var(--product-image-radius-lg)] transition-transform duration-700 ease-out group-hover:scale-[1.015]">
                      <Image
                        src={coverImage}
                        alt={product.name}
                        fill
                        onLoad={() => setImageLoaded(true)}
                        className={cn(
                          "object-contain p-2.5 drop-shadow-[0_18px_28px_rgba(15,23,42,0.12)] transition-[opacity,filter] duration-500 ease-out sm:p-4",
                          isSpotlightProduct && "sm:p-5",
                          imageLoaded ? "opacity-100" : "opacity-0",
                        )}
                        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
                        quality={75}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-14 w-14 text-gray-300" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.5),transparent_38%),linear-gradient(180deg,transparent_52%,rgba(15,23,42,0.12)_100%)]" />

                  {normalizedImages.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 z-[6] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/80 bg-white/72 px-1.5 py-0.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)] backdrop-blur sm:bottom-2.5 sm:gap-1.5 sm:px-2 sm:py-1">
                      {normalizedImages.slice(0, 4).map((_, imageIndex) => (
                        <span
                          key={imageIndex}
                          className={cn(
                            "rounded-full transition-all duration-300",
                            imageIndex === activeImageIndex
                              ? "h-1 w-3.5 bg-[var(--foreground)] sm:h-1.5 sm:w-5"
                              : "h-1 w-1 bg-[var(--muted-soft)]/25 sm:h-1 sm:w-1",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Link>

              {!requiresVariantSelection && (
                <div
                  className={cn(
                    "absolute bottom-2.5 right-4 z-[7] hidden transition-all duration-300 sm:block",
                    isHovered
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0",
                  )}
                >
                  <button
                    onClick={handleAddToCart}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border border-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300",
                      addedItemId === product.id
                        ? "scale-105 bg-emerald-500 text-white"
                        : "bg-white/88 text-[var(--foreground)] hover:-translate-y-0.5 hover:bg-[var(--foreground)] hover:text-white",
                    )}
                    aria-label={t("productCard.addToCart")}
                    type="button"
                  >
                    {addedItemId === product.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <Link
              href={`/producto/${product.slug}`}
              className="flex flex-1 flex-col px-4 pb-4 pt-5 sm:px-5 sm:pb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] rounded-b-[1.4rem]"
              aria-label={product.name}
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[var(--muted-soft)]">
                {rating > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[var(--muted-strong)]">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                  </span>
                ) : null}
                {isSpotlightProduct ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    Producto estrella
                  </span>
                ) : null}
                {socialLine ? <span>{socialLine}</span> : null}
              </div>

              <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--accent-strong)] sm:text-base">
                {product.name}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                {deliveryLine}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                <span>Pagas al recibir</span>
              </div>

              <div className="mt-auto pt-4">
                <div className="flex flex-wrap items-end gap-2.5">
                  <span
                    suppressHydrationWarning
                    className="text-[1.45rem] font-bold tracking-tight text-[var(--foreground)]"
                  >
                    {formatDisplayPrice(product.price)}
                  </span>
                  {effectiveCompareAtPrice > 0 && (
                    <span
                      suppressHydrationWarning
                      className="pb-1 text-xs font-medium text-[var(--muted-soft)] line-through"
                    >
                      {formatDisplayPrice(effectiveCompareAtPrice)}
                    </span>
                  )}
                  {discount > 0 && effectiveCompareAtPrice > 0 && (
                    <span suppressHydrationWarning className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Ahorras {formatDisplayPrice(effectiveCompareAtPrice - product.price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            {requiresVariantSelection ? (
              <Button
                onClick={handlePrimaryAction}
                size="sm"
                className="w-full gap-2"
                aria-label={t("productCard.viewProduct")}
              >
                <ArrowRight className="h-4 w-4" />
                {t("productCard.viewProduct")}
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleBuyNow}
                  size="sm"
                  className="w-full gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Comprar ahora
                </Button>
                <Button
                  onClick={handlePrimaryAction}
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  aria-label={t("productCard.addToCart")}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {t("productCard.addToCart")}
                </Button>
              </div>
            )}
          </div>
          </div>
        </article>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.average_rating === nextProps.product.average_rating &&
    prevProps.enableImageRotation === nextProps.enableImageRotation &&
    prevProps.deliveryEstimate?.min === nextProps.deliveryEstimate?.min &&
    prevProps.deliveryEstimate?.max === nextProps.deliveryEstimate?.max,
);
