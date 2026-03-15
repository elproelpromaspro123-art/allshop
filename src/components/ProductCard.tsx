"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Truck, Star } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";
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
  deliveryEstimate = null,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const estimate = deliveryEstimate;

  const requiresVariantSelection = product.variants.some(
    (variant) => variant.options.length > 1
  );
  const normalizedImages = useMemo(
    () => product.images.map((image) => normalizeLegacyImagePath(image)),
    [product.images]
  );
  const productHasFreeShipping = isProductShippingFree({
    id: product.id,
    slug: product.slug,
    free_shipping: product.free_shipping ?? null,
  });

  const effectiveCompareAtPrice = getEffectiveCompareAtPrice(product);
  const discount = calculateDiscount(product.price, effectiveCompareAtPrice);

  const fakeRating = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < product.slug.length; i++) {
      hash = product.slug.charCodeAt(i) + ((hash << 5) - hash);
    }
    const ratingOptions = [3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7];
    return ratingOptions[Math.abs(hash) % ratingOptions.length];
  }, [product.slug]);

  const coverImage = normalizedImages[activeImageIndex] || normalizedImages[0] || "";
  const componentKey = `${product.id}:${product.slug}`;

  useEffect(() => {
    if (!enableImageRotation || normalizedImages.length <= 1) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveImageIndex((previous) => (previous + 1) % normalizedImages.length);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [enableImageRotation, normalizedImages.length]);

  const handleAddToCart = () => {
    const cartImage = coverImage || normalizeLegacyImagePath(product.images[0] ?? "");
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

  const isNational = true;

  return (
    <div
      key={componentKey}
      className="group"
    >
      <article
        className="relative rounded-[var(--card-radius)] border overflow-hidden bg-white border-[var(--border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] md:hover:-translate-y-1.5 hover:border-[var(--secondary)]/20 transition-all duration-300"
      >
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          aria-label={product.name}
        >
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[var(--surface-muted)] to-[#eef5f0]">
            {coverImage ? (
              <div className="relative w-full h-full">
                <div className="absolute inset-2 sm:inset-3 rounded-[calc(var(--card-radius)-0.5rem)] overflow-hidden bg-white/90">
                  <div className="absolute inset-0">
                    <Image
                      src={coverImage}
                      alt={product.name}
                      fill
                      className="object-contain p-3 sm:p-4"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={index < 4}
                      quality={75}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex">
              <span className="text-[11px] font-semibold tracking-wide px-4 py-1.5 rounded-full backdrop-blur-md bg-white/80 text-[var(--muted-strong)]">
                {t("productCard.viewProduct")}
              </span>
            </div>

            <div className="absolute top-2.5 left-2.5 z-[6] flex flex-col gap-1.5 items-start">
              {product.is_bestseller ? (
                <span className="h-6 px-2.5 inline-flex items-center rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-sm whitespace-nowrap">
                  {t("productCard.bestseller")}
                </span>
              ) : null}
              {discount > 0 ? (
                <span className="h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-bold bg-[var(--accent-strong)] text-white shadow-[var(--shadow-accent-pill)]">
                  -{discount}%
                </span>
              ) : null}
            </div>

            {productHasFreeShipping ? (
                <span className="absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-strong)]/8 text-[var(--accent-strong)]">
                  <Truck className="w-3 h-3" />
                  <span>{t("productCard.freeShipping")}</span>
                </span>
            ) : (
              <span className="absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm bg-white/80 text-[var(--muted)]">
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {isNational
                    ? t("productCard.national")
                    : t("productCard.international")}
                </span>
              </span>
            )}
          </div>

          <div className="px-3 pt-3 pb-1 sm:px-4 sm:pt-4 sm:pb-1.5 flex flex-col gap-2">
            <h3 className="text-[13px] sm:text-sm leading-snug font-semibold text-[var(--foreground)] line-clamp-2">
              {product.name}
            </h3>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const fullStars = Math.floor(fakeRating);
                  const hasHalfStar = fakeRating - fullStars >= 0.5 && fullStars < 5;
                  let starClass = "fill-amber-400/20 text-amber-400/35";
                  if (i < fullStars) {
                    starClass = "fill-amber-400 text-amber-400";
                  } else if (i === fullStars && hasHalfStar) {
                    starClass = "fill-amber-400/55 text-amber-400";
                  }
                  return (
                    <Star key={i} className={`w-2.5 h-2.5 ${starClass}`} />
                  );
                })}
              </div>
              <span className="sr-only">{fakeRating} de 5 estrellas</span>
              <span className="text-[10px] text-[var(--muted-soft)] font-medium">
                {fakeRating.toFixed(1)}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                suppressHydrationWarning
                className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)]"
              >
                {formatDisplayPrice(product.price)}
              </span>
              {effectiveCompareAtPrice > 0 ? (
                <span
                  suppressHydrationWarning
                  className="text-[11px] line-through text-[var(--muted-soft)]"
                >
                  {formatDisplayPrice(effectiveCompareAtPrice)}
                </span>
              ) : null}
            </div>

            {/* Secondary metadata: always visible on mobile, hover-reveal on desktop */}
            <div className="flex items-center gap-2 flex-wrap md:max-h-0 md:overflow-hidden md:opacity-0 md:group-hover:max-h-24 md:group-hover:opacity-100 transition-all duration-300 ease-out">
              {discount > 0 ? (
                <span className="text-[10px] font-semibold text-[var(--accent-strong)]">
                  {t("productCard.savings")} {formatDisplayPrice(effectiveCompareAtPrice - product.price)}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--secondary-strong)] bg-[var(--secondary-surface)] rounded-full px-2 py-0.5">
                {t("productCard.codPayment")}
              </span>
              {estimate ? (
                <span
                  className="text-[10px] font-medium text-[var(--accent-strong)] flex items-center gap-1 w-full"
                  title={t("productCard.deliveryEstTitle", { min: estimate.min, max: estimate.max })}
                >
                  <Truck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{t("productCard.deliveryEstMin")} {estimate.min}-{estimate.max} {t("productCard.deliveryEstMax")}</span>
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-2">
          <Button
            onClick={handlePrimaryAction}
            size="sm"
            className="w-full gap-1.5"
            aria-label={
              requiresVariantSelection
                ? t("productCard.viewProduct")
                : t("productCard.addToCart")
            }
          >
            {requiresVariantSelection ? (
              <ArrowRight className="w-3.5 h-3.5" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5" />
            )}
            {requiresVariantSelection
              ? t("productCard.viewProduct")
              : t("productCard.addToCart")}
          </Button>
        </div>
      </article>
    </div>
  );
}

