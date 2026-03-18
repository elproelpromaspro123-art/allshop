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
  deliveryEstimate = null,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
  const rating = product.average_rating || 0;
  const coverImage = normalizedImages[activeImageIndex] || normalizedImages[0] || "";
  const componentKey = `${product.id}:${product.slug}`;
  const deliveryLine = deliveryEstimate
    ? `Entrega estimada ${deliveryEstimate.min}-${deliveryEstimate.max} dias habiles`
    : "Entrega nacional con seguimiento";

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
          <div className="relative aspect-[0.95] overflow-hidden bg-[linear-gradient(180deg,#fdfefd_0%,#f5f7fb_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,130,0.08),transparent_28%)]" />
            <div className="absolute inset-3 rounded-[calc(var(--radius-md)-6px)] border border-white/70 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]" />

            {coverImage ? (
              <div className="relative z-[1] h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-contain p-6 sm:p-7"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index < 4}
                  quality={84}
                />
              </div>
            ) : null}

            <div className="absolute left-3 top-3 z-[6]">
              {discount > 0 ? (
                <span className="inline-flex h-7 items-center rounded-full bg-[var(--accent-strong)] px-3 text-[11px] font-bold text-white shadow-sm">
                  -{discount}%
                </span>
              ) : product.is_bestseller ? (
                <span className="inline-flex h-7 items-center gap-1 rounded-full bg-amber-400 px-3 text-[11px] font-bold text-amber-950 shadow-sm">
                  <Zap className="h-3 w-3" />
                  {t("productCard.bestseller")}
                </span>
              ) : null}
            </div>

            <div className="absolute right-3 top-3 z-[6]">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold shadow-sm ${
                  productHasFreeShipping
                    ? "bg-[linear-gradient(135deg,#00c879_0%,#009e61_100%)] text-white"
                    : "border border-[var(--border-subtle)] bg-white/88 text-[var(--muted-strong)] backdrop-blur-md"
                }`}
              >
                <Truck className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {productHasFreeShipping
                    ? t("productCard.freeShipping")
                    : t("productCard.national")}
                </span>
                <span className="sm:hidden">
                  {productHasFreeShipping ? "Gratis" : "Nacional"}
                </span>
              </span>
            </div>
          </div>

          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                Curado por Vortixy
              </p>
              {rating > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
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
                  <span className="text-[11px] font-semibold text-[var(--muted-soft)]">
                    {rating.toFixed(1)}
                  </span>
                </div>
              ) : null}
            </div>

            <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent-dim)] sm:text-base">
              {product.name}
            </h3>

            <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
              {deliveryLine}
            </p>

            <div className="mt-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    suppressHydrationWarning
                    className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-[1.85rem]"
                  >
                    {formatDisplayPrice(product.price)}
                  </span>
                  {effectiveCompareAtPrice > 0 ? (
                    <span
                      suppressHydrationWarning
                      className="text-xs font-medium text-[var(--muted-faint)] line-through"
                    >
                      {formatDisplayPrice(effectiveCompareAtPrice)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] font-medium text-[var(--muted-soft)]">
                  {t("productCard.codPayment")} /{" "}
                  {productHasFreeShipping
                    ? t("productCard.freeShipping")
                    : t("productCard.national")}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
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
