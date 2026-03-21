"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Star, Truck, Zap, Check } from "lucide-react";
import { useEffect, useMemo, useState, memo } from "react";
import { calculateDiscount, cn } from "@/lib/utils";
import { isProductShippingFree } from "@/lib/shipping";
import { normalizeLegacyImagePath } from "@/lib/image-paths";
import { getEffectiveCompareAtPrice } from "@/lib/promo-pricing";
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

export const ProductCard = memo(function ProductCardComponent({
  product,
  index = 0,
  enableImageRotation = true,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
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
  const componentKey = `${product.id}:${product.slug}`;

  useEffect(() => {
    if (!enableImageRotation || normalizedImages.length <= 1) return;
    if (typeof window !== 'undefined' && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Autoplay: ciclo continuo cada 3s, acelera en hover
    const interval = isHovered ? 2000 : 3000;
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
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
    setTimeout(() => setAddedItemId(null), 600);
    toast(t("cart.added"), "success");
  };

  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
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
      className="group animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="product-surface relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-white to-gray-50 shadow-[var(--shadow-sm)] ring-1 ring-black/[0.04] transition-all duration-500 ease-out hover:shadow-[var(--shadow-xl)] hover:-translate-y-2 hover:ring-[var(--accent)]/25 before:absolute before:inset-0 before:rounded-[1.25rem] before:bg-gradient-to-br before:from-[var(--accent)]/0 before:to-[var(--accent)]/0 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-10">
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          aria-label={product.name}
        >
          {/* Image container with enhanced effects */}
          <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-gray-50 to-gray-100 m-2 sm:m-3">
            {coverImage ? (
              <div className="relative z-[1] h-full w-full transition-transform duration-700 ease-out group-hover:scale-108">
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-contain p-2 sm:p-3 mix-blend-multiply"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index < 2}
                  quality={84}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-gray-300" />
              </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Badges */}
            <div className="absolute left-2 top-2 z-[6] flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-md bg-gradient-to-r from-red-600 to-orange-500 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(220,38,38,0.4)] ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 hover:scale-105 cursor-default">
                  <Zap className="h-3 w-3 mr-1 drop-shadow-sm" />
                  -{discount}%
                </span>
              )}
              {product.is_bestseller && (
                <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-md bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(245,158,11,0.4)] ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 hover:scale-105 cursor-default">
                  <Star className="h-3 w-3 mr-1 drop-shadow-sm fill-white" />
                  TOP
                </span>
              )}
            </div>

            {/* Free shipping badge */}
            {productHasFreeShipping && (
              <div className="absolute right-2 top-2 z-[6]">
                <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)] ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 hover:scale-105 cursor-default">
                  <Truck className="h-3 w-3 mr-1 drop-shadow-sm" />
                  <span className="hidden sm:inline">Envío Gratis</span>
                </span>
              </div>
            )}

            {/* Quick add button on hover */}
            {!requiresVariantSelection && (
              <div
                className={`absolute bottom-2 right-2 z-[6] transition-all duration-500 ${
                  isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                  }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full shadow-lg ring-1 ring-black/10 transition-all duration-500",
                    addedItemId === product.id
                      ? "bg-emerald-500 scale-110"
                      : "bg-white text-[var(--accent-strong)] hover:scale-125 hover:bg-[var(--accent-strong)] hover:text-white"
                  )}
                  aria-label={t("productCard.addToCart")}
                >
                  {addedItemId === product.id ? (
                    <Check className="h-4 w-4 text-white animate-bounce" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}

            {normalizedImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[6] flex items-center gap-1">
                {normalizedImages.slice(0, 4).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-2 h-2 sm:w-1.5 sm:h-1.5 rounded-full transition-all",
                      i === activeImageIndex ? "bg-white scale-125" : "bg-white/40",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="line-clamp-2 text-base font-extrabold leading-snug tracking-tight text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--accent-strong)]">
              {product.name}
            </h3>

            {rating > 0 && (
              <div className="mt-3 flex items-center gap-2" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
                <div className="flex items-center gap-1" aria-hidden="true">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={`h-4 w-4 transition-all duration-200 ${
                        starIndex < Math.floor(rating)
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "fill-gray-200 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[var(--muted-strong)]">
                  {rating.toFixed(1)}⭐
                </span>
              </div>
            )}

            {/* Price section */}
            <div className="mt-4 space-y-2">
              <div className="flex items-baseline gap-3">
                <span
                  suppressHydrationWarning
                  className="text-lg sm:text-xl font-black tracking-tight text-[var(--foreground)]"
                >
                  {formatDisplayPrice(product.price)}
                </span>
                {effectiveCompareAtPrice > 0 && (
                  <span
                    suppressHydrationWarning
                    className="text-xs font-medium text-[var(--muted-soft)] line-through"
                  >
                    {formatDisplayPrice(effectiveCompareAtPrice)}
                  </span>
                )}
              </div>
            </div>
            {discount > 0 && effectiveCompareAtPrice > 0 && (
              <p className="mt-1.5 text-[11px] font-bold text-emerald-600">
                Ahorras {formatDisplayPrice(effectiveCompareAtPrice - product.price)}
              </p>
            )}
          </div>
        </Link>

        {/* Action button */}
        <div className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3">
          <Button
            onClick={handlePrimaryAction}
            size="sm"
            className="w-full gap-2 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            aria-label={
              requiresVariantSelection
                ? t("productCard.viewProduct")
                : t("productCard.addToCart")
            }
          >
            {requiresVariantSelection ? (
              <>
                <ArrowRight className="h-4 w-4" />
                {t("productCard.viewProduct")}
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                {t("productCard.addToCart")}
              </>
            )}
          </Button>
        </div>
      </article>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - solo re-renderizar si realmente cambió
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.price === nextProps.product.price &&
         prevProps.product.average_rating === nextProps.product.average_rating &&
         prevProps.enableImageRotation === nextProps.enableImageRotation;
});
