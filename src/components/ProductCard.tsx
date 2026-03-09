"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag, Truck } from "lucide-react";
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

interface ProductCardProps {
  product: Product;
  index?: number;
  enableImageRotation?: boolean;
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
  const [isHovered, setIsHovered] = useState(false);
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
  const coverImage = normalizedImages[activeImageIndex] || normalizedImages[0] || "";
  const componentKey = `${product.id}:${product.slug}`;

  useEffect(() => {
    if (!enableImageRotation || normalizedImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveImageIndex((previous) => (previous + 1) % normalizedImages.length);
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
      stockLocation: "nacional",
    });
    toast("Producto añadido al carrito", "success");
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
    <motion.div
      key={componentKey}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article
        className="relative rounded-2xl border overflow-hidden transition-all duration-400 bg-white border-[var(--border)]"
        style={{
          boxShadow: isHovered
            ? "0 20px 40px -12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,169,104,0.08)"
            : "var(--shadow-card)",
          transform: isHovered ? "translateY(-4px)" : "translateY(0)",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          aria-label={product.name}
        >
          <div
            className="relative aspect-square overflow-hidden bg-gradient-to-br from-[var(--surface-muted)] to-[#eef5f0]"
          >
            {coverImage ? (
              <div
                className="relative w-full h-full transition-transform duration-500 ease-out"
                style={{
                  transform: isHovered ? "scale(1.04)" : "scale(1)",
                }}
              >
                <div className="absolute inset-2 sm:inset-3 rounded-[1.15rem] overflow-hidden border border-white/70 bg-white/90">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={coverImage}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.03 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={coverImage}
                        alt={product.name}
                        fill
                        className="object-contain p-3 sm:p-4"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={index < 4}
                        quality={85}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ) : null}

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/[0.04]"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="text-[11px] font-semibold tracking-wide px-4 py-1.5 rounded-full backdrop-blur-md bg-white/80 text-neutral-700"
                  >
                    {t("productCard.viewProduct")}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-2.5 left-2.5 z-[6] flex flex-col gap-1.5 items-start">
              {product.is_bestseller && (
                <span className="h-6 px-2.5 inline-flex items-center rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-sm whitespace-nowrap">
                  Más vendido
                </span>
              )}
              {discount > 0 && (
                <span className="h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-bold bg-[var(--accent-strong)] text-white shadow-[0_2px_8px_-2px_rgba(0,169,104,0.35)]">
                  -{discount}%
                </span>
              )}
            </div>

            {productHasFreeShipping && (
              <span
                className="absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-strong)]/8 text-[var(--accent-strong)]"
              >
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">Envío gratis</span>
              </span>
            )}

            {!productHasFreeShipping && (
              <span
                className="absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm bg-white/80 text-neutral-600"
              >
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {isNational
                    ? t("productCard.national")
                    : t("productCard.international")}
                </span>
              </span>
            )}
          </div>

          <div className="px-3 pt-3 sm:px-4 sm:pt-4 space-y-2">
            <h3
              className="text-[13px] sm:text-sm leading-snug font-semibold text-[var(--foreground)]"
            >
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span
                suppressHydrationWarning
                className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)]"
              >
                {formatDisplayPrice(product.price)}
              </span>
              {effectiveCompareAtPrice > 0 && (
                <span
                  suppressHydrationWarning
                  className="text-[11px] line-through text-neutral-600"
                >
                  {formatDisplayPrice(effectiveCompareAtPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[10px] font-semibold text-[var(--accent-strong)]">
                  -{discount}%
                </span>
              )}
            </div>

            <p
              className="text-[11px] text-[var(--muted)]"
            >
              {isNational
                ? t("productCard.nationalDispatch")
                : t("productCard.internationalDispatch")}
            </p>
          </div>
        </Link>

        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1">
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
    </motion.div>
  );
}
