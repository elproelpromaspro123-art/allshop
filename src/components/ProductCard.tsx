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
    const isSpotlightProduct = product.is_featured === true;
    const componentKey = `${product.id}:${product.slug}`;
    const deliveryLine = deliveryEstimate
      ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
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
        className="group h-full"
        style={{ animationDelay: `${index * 0.05}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <article
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
            isSpotlightProduct
              ? "border-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.12)]"
              : "border-gray-100 hover:border-emerald-200/60",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Image section */}
            <div className="relative">
              <Link
                href={`/producto/${product.slug}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                aria-label={product.name}
              >
                <div
                  className={cn(
                    "relative mx-1.5 mt-1.5 aspect-square overflow-hidden rounded-xl border bg-gradient-to-b from-white to-gray-50 sm:mx-2 sm:mt-2",
                    isSpotlightProduct
                      ? "border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30"
                      : "border-gray-100/60",
                  )}
                >
                  {/* Badges */}
                  <div className="absolute inset-x-1.5 top-1.5 z-10 flex items-start justify-between gap-1 sm:inset-x-2 sm:top-2">
                    <div className="flex max-w-[65%] flex-wrap gap-1">
                      {product.is_bestseller && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-900/85 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm sm:px-2 sm:py-1 sm:text-[10px]">
                          <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" />
                          {t("productCard.bestseller")}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-bold text-amber-950 sm:px-2 sm:py-1 sm:text-[10px]">
                          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          -{discount}%
                        </span>
                      )}
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[8px] font-semibold text-white sm:px-2 sm:py-1 sm:text-[10px]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                          Poco stock
                        </span>
                      )}
                    </div>

                    {productHasFreeShipping && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200/70 bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700 backdrop-blur-sm sm:px-2 sm:py-1 sm:text-[10px]">
                        <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">
                          {t("productCard.freeShipping")}
                        </span>
                        <span className="sm:hidden">Gratis</span>
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  {coverImage ? (
                    <div className="relative h-full w-full overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                      <Image
                        src={coverImage}
                        alt={product.name}
                        fill
                        onLoad={() => setImageLoaded(true)}
                        className={cn(
                          "object-contain p-3 drop-shadow-sm transition-opacity duration-400 sm:p-4",
                          imageLoaded ? "opacity-100" : "opacity-0",
                        )}
                        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
                        quality={75}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-gray-200" />
                    </div>
                  )}

                  {/* Image dots */}
                  {normalizedImages.length > 1 && (
                    <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-white/80 px-1.5 py-0.5 backdrop-blur-sm sm:bottom-2">
                      {normalizedImages.slice(0, 4).map((_, imageIndex) => (
                        <span
                          key={imageIndex}
                          className={cn(
                            "rounded-full transition-all duration-300",
                            imageIndex === activeImageIndex
                              ? "h-1 w-3 bg-gray-800 sm:h-1.5 sm:w-4"
                              : "h-1 w-1 bg-gray-300 sm:h-1.5 sm:w-1.5",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Link>

              {/* Quick add button (desktop hover) */}
              {!requiresVariantSelection && (
                <div
                  className={cn(
                    "absolute bottom-3 right-3 z-20 hidden transition-all duration-300 sm:block",
                    isHovered
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0",
                  )}
                >
                  <button
                    onClick={handleAddToCart}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm transition-all duration-200",
                      addedItemId === product.id
                        ? "scale-110 border-emerald-300 bg-emerald-500 text-white"
                        : "border-white/80 bg-white/90 text-gray-700 hover:bg-gray-900 hover:text-white",
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

            {/* Info section */}
            <Link
              href={`/producto/${product.slug}`}
              className="flex flex-1 flex-col px-3 pb-3 pt-3 focus-visible:outline-none sm:px-4 sm:pb-4 sm:pt-4"
              aria-label={product.name}
            >
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-gray-400 sm:text-[11px]">
                {rating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-gray-600">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {isSpotlightProduct && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Estrella
                  </span>
                )}
                {socialLine && <span>{socialLine}</span>}
              </div>

              {/* Title */}
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-gray-900 transition-colors duration-200 group-hover:text-emerald-700 sm:text-[15px]">
                {product.name}
              </h3>

              {/* Delivery + trust */}
              <div className="mt-2 space-y-1">
                <p className="text-[11px] text-gray-400 sm:text-xs">
                  {deliveryLine}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 sm:text-xs">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Pagas al recibir</span>
                </div>
              </div>

              {/* Price */}
              <div className="mt-auto pt-3">
                <div className="flex flex-wrap items-end gap-1.5">
                  <span
                    suppressHydrationWarning
                    className="text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                  >
                    {formatDisplayPrice(product.price)}
                  </span>
                  {effectiveCompareAtPrice > 0 && (
                    <span
                      suppressHydrationWarning
                      className="pb-0.5 text-xs text-gray-400 line-through"
                    >
                      {formatDisplayPrice(effectiveCompareAtPrice)}
                    </span>
                  )}
                  {discount > 0 && effectiveCompareAtPrice > 0 && (
                    <span
                      suppressHydrationWarning
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                    >
                      Ahorras{" "}
                      {formatDisplayPrice(
                        effectiveCompareAtPrice - product.price,
                      )}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Actions */}
            <div className="px-3 pb-3 sm:px-4 sm:pb-4">
              {requiresVariantSelection ? (
                <Button
                  onClick={handlePrimaryAction}
                  size="sm"
                  className="min-h-[42px] w-full gap-2"
                  aria-label={t("productCard.viewProduct")}
                >
                  <ArrowRight className="h-4 w-4" />
                  {t("productCard.viewProduct")}
                </Button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Button
                    onClick={handleBuyNow}
                    size="sm"
                    className="min-h-[42px] w-full gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Comprar ahora
                  </Button>
                  <Button
                    onClick={handlePrimaryAction}
                    variant="ghost"
                    size="sm"
                    className="min-h-[38px] w-full gap-2 text-xs"
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
