"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Star, Truck, Zap } from "lucide-react";
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

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveImageIndex(
          (previous) => (previous + 1) % normalizedImages.length,
        );
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [enableImageRotation, normalizedImages.length]);

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
    >
      <article className="product-surface relative overflow-hidden">
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          aria-label={product.name}
        >
          <div className="relative aspect-square sm:aspect-[0.95] overflow-hidden">
            {coverImage ? (
              <div className="relative z-[1] h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-contain p-5 sm:p-6"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index < 2}
                  quality={84}
                />
              </div>
            ) : null}

            <div className="absolute left-3 top-3 z-[6] flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="inline-flex h-6 items-center rounded-full bg-[var(--foreground)] px-2.5 text-[10px] font-semibold text-white">
                  -{discount}%
                </span>
              )}
              {product.is_bestseller && (
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[var(--warm)] px-2.5 text-[10px] font-semibold text-white">
                  <Zap className="h-2.5 w-2.5" />
                  {t("productCard.bestseller")}
                </span>
              )}
            </div>

            {productHasFreeShipping && (
              <div className="absolute right-3 top-3 z-[6]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold text-white">
                  <Truck className="h-2.5 w-2.5" />
                </span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--accent)]">
              {product.name}
            </h3>

            {rating > 0 && (
              <div className="mt-2 flex items-center gap-1.5" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={`h-3 w-3 ${
                        starIndex < Math.floor(rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-amber-400/20 text-amber-400/35"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-[var(--muted-soft)]">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span
                  suppressHydrationWarning
                  className="text-[1.4rem] font-bold tracking-tight text-[var(--foreground)]"
                >
                  {formatDisplayPrice(product.price)}
                </span>
                {effectiveCompareAtPrice > 0 && (
                  <span
                    suppressHydrationWarning
                    className="text-xs font-medium text-[var(--muted-faint)] line-through"
                  >
                    {formatDisplayPrice(effectiveCompareAtPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        <div className="px-3 pb-3 pt-2.5 sm:px-5 sm:pb-5 sm:pt-4">
          <Button
            onClick={handlePrimaryAction}
            size="sm"
            className="w-full gap-2"
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
