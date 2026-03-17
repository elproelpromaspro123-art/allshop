"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck, Star, Zap } from "lucide-react";
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
    let Hash = 0;
    for (let i = 0; i < product.slug.length; i++) {
      Hash = product.slug.charCodeAt(i) + ((Hash << 5) - Hash);
    }
    const ratingOptions = [3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7];
    return ratingOptions[Math.abs(Hash) % ratingOptions.length];
  }, [product.slug]);

  const fakeSoldCount = useMemo(() => {
    let h = 0;
    for (let i = 0; i < product.slug.length; i++) {
      h = product.slug.charCodeAt(i) + ((h << 5) - h);
    }
    return 15 + (Math.abs(h) % 75);
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
      className="group animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <article
        className="relative rounded-2xl border overflow-hidden bg-gradient-to-br from-white to-[var(--surface-muted)]/30 border-[var(--border-subtle)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-lift)] md:hover:-translate-y-2 hover:border-[var(--accent)]/20 transition-all duration-500 ease-out"
      >
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          aria-label={product.name}
        >
          {/* Image Container with Enhanced Effects */}
          <div className="relative aspect-square overflow-hidden bg-white">
            {coverImage ? (
              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
                <div className="absolute inset-1.5 sm:inset-2 rounded-[calc(var(--card-radius)-0.125rem)] overflow-hidden bg-gradient-to-br from-gray-50/50 to-white shadow-inner">
                  <div className="absolute inset-0">
                    <Image
                      src={coverImage}
                      alt={product.name}
                      fill
                      className="object-contain p-3 sm:p-4 mix-blend-multiply"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={index < 4}
                      quality={80}
                    />
                  </div>
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            ) : null}

            {/* Quick View Overlay */}
            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 hidden md:flex">
              <span className="text-xs font-bold tracking-wide px-5 py-2 rounded-full backdrop-blur-xl bg-white/90 text-[var(--foreground)] shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                {t("productCard.viewProduct")}
              </span>
            </div>

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 z-[6] flex flex-col gap-1.5 items-start">
              {product.is_bestseller ? (
                <span className="h-7 px-3 inline-flex items-center rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-md shadow-amber-500/20 animate-subtle-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  {t("productCard.bestseller")}
                </span>
              ) : null}
              {discount > 0 ? (
                <span className="h-7 px-3 inline-flex items-center rounded-full text-[11px] font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white shadow-md shadow-[var(--accent-glow)] animate-badge-shimmer">
                  -{discount}%
                </span>
              ) : null}
            </div>

            {/* Shipping Badge */}
            {productHasFreeShipping ? (
              <span className="absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--accent)]/90 to-[var(--accent-strong)]/90 text-white shadow-md backdrop-blur-sm">
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">{t("productCard.freeShipping")}</span>
                <span className="sm:hidden">Envío Gratis</span>
              </span>
            ) : (
              <span className="absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-full backdrop-blur-md bg-white/85 text-[var(--muted-strong)] border border-[var(--border-subtle)]">
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {isNational ? t("productCard.national") : t("productCard.international")}
                </span>
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="px-3.5 pt-3.5 pb-1 sm:px-4.5 sm:pt-4.5 sm:pb-2 flex flex-col gap-2.5">
            {/* Product Name */}
            <h3 className="text-[13px] sm:text-sm leading-snug font-bold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent-strong)] transition-colors duration-300">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const fullStars = Math.floor(fakeRating);
                  const hasHalfStar = fakeRating - fullStars >= 0.5 && fullStars < 5;
                  let starClass = "fill-amber-400/20 text-amber-400/35";
                  if (i < fullStars) {
                    starClass = "fill-amber-400 text-amber-400 drop-shadow-sm";
                  } else if (i === fullStars && hasHalfStar) {
                    starClass = "fill-amber-400/55 text-amber-400";
                  }
                  return (
                    <Star key={i} className={`w-2.5 h-2.5 ${starClass} transition-all duration-300`} style={{ transitionDelay: `${i * 50}ms` }} />
                  );
                })}
              </div>
              <span className="text-[10px] text-[var(--muted-soft)] font-bold">
                {fakeRating.toFixed(1)}
              </span>
            </div>

            {/* Trust micro-badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                {t("productCard.guarantee")}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)] bg-[var(--surface-muted)] rounded-full px-2 py-0.5">
                {fakeSoldCount} {t("productCard.sold")}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                suppressHydrationWarning
                className="text-lg sm:text-xl font-black tracking-tight text-[var(--foreground)]"
              >
                {formatDisplayPrice(product.price)}
              </span>
              {effectiveCompareAtPrice > 0 ? (
                <span
                  suppressHydrationWarning
                  className="text-[11px] line-through text-[var(--muted-faint)] font-medium"
                >
                  {formatDisplayPrice(effectiveCompareAtPrice)}
                </span>
              ) : null}
            </div>

            {/* Secondary Metadata - Hover Reveal on Desktop */}
            <div className="flex items-center gap-2 flex-wrap">
              {discount > 0 ? (
                <span className="text-[10px] font-bold text-[var(--accent-strong)] bg-[var(--accent-surface)] rounded-full px-2.5 py-1">
                  Ahorras {formatDisplayPrice(effectiveCompareAtPrice - product.price)}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--secondary-strong)] bg-[var(--secondary-surface)] rounded-full px-2.5 py-1">
                <Zap className="w-3 h-3" />
                {t("productCard.codPayment")}
              </span>
              {estimate ? (
                <span
                  className="text-[10px] font-bold text-[var(--accent-strong)] bg-[var(--accent-surface)] rounded-full px-2.5 py-1 flex items-center gap-1"
                  title={t("productCard.deliveryEstTitle", { min: estimate.min, max: estimate.max })}
                >
                  <Truck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{estimate.min}-{estimate.max} días</span>
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        {/* Add to Cart Button */}
        <div className="px-3.5 pb-3.5 sm:px-4.5 sm:pb-4 pt-2">
          <Button
            onClick={handlePrimaryAction}
            size="sm"
            className="w-full gap-2 group/btn"
            aria-label={
              requiresVariantSelection
                ? t("productCard.viewProduct")
                : t("productCard.addToCart")
            }
          >
            {requiresVariantSelection ? (
              <>
                <ArrowRight className="w-4 h-4" />
                {t("productCard.viewProduct")}
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                {t("productCard.addToCart")}
              </>
            )}
          </Button>
        </div>
      </article>
    </div>
  );
}
