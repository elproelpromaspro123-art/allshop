"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Star, Truck, Zap, Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { calculateDiscount } from "@/lib/utils";
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

export function ProductCard({
  product,
  index = 0,
  enableImageRotation = false,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!isHovered) return; // Only rotate when hovered

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveImageIndex(
          (previous) => (previous + 1) % normalizedImages.length,
        );
      }
    }, 3000);

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
      <article className="product-surface relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--accent-glow)] hover:-translate-y-1">
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          aria-label={product.name}
        >
          {/* Image container with enhanced effects */}
          <div className="relative aspect-square sm:aspect-[0.95] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            {coverImage ? (
              <div className="relative z-[1] h-full w-full transition-transform duration-500 ease-out group-hover:scale-110">
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-contain p-4 sm:p-6 mix-blend-multiply"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Badges */}
            <div className="absolute left-2 top-2 z-[6] flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="inline-flex h-7 items-center rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 text-[11px] font-bold text-white shadow-lg shadow-red-500/30">
                  -{discount}%
                </span>
              )}
              {product.is_bestseller && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-amber-500/30">
                  <Zap className="h-2.5 w-2.5" />
                  {t("productCard.bestseller")}
                </span>
              )}
            </div>

            {/* Free shipping badge */}
            {productHasFreeShipping && (
              <div className="absolute right-2 top-2 z-[6]">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dim)] px-2.5 py-1 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/30">
                  <Truck className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">Envío Gratis</span>
                </span>
              </div>
            )}

            {/* Quick add button on hover */}
            {!requiresVariantSelection && (
              <div
                className={`absolute bottom-2 right-2 z-[6] transition-all duration-300 ${
                  isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--accent-strong)] shadow-lg ring-1 ring-black/10 transition-transform hover:scale-110 hover:bg-[var(--accent-strong)] hover:text-white"
                  aria-label={t("productCard.addToCart")}
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="p-3 sm:p-4">
            <h3 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--accent)]">
              {product.name}
            </h3>

            {rating > 0 && (
              <div className="mt-2 flex items-center gap-1" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={`h-2.5 w-2.5 ${
                        starIndex < Math.floor(rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-[var(--muted-soft)]">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Price section */}
            <div className="mt-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span
                  suppressHydrationWarning
                  className="text-[1.3rem] font-black tracking-tight text-[var(--foreground)]"
                >
                  {formatDisplayPrice(product.price)}
                </span>
                {effectiveCompareAtPrice > 0 && (
                  <span
                    suppressHydrationWarning
                    className="text-[11px] font-semibold text-[var(--muted-faint)] line-through"
                  >
                    {formatDisplayPrice(effectiveCompareAtPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Action button */}
        <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
          <Button
            onClick={handlePrimaryAction}
            size="sm"
            className="w-full gap-2 font-semibold shadow-sm hover:shadow-md transition-all duration-300"
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
}
