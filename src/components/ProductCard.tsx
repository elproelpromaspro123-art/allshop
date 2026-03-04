"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { calculateDiscount } from "@/lib/utils";
import { isProductShippingFree } from "@/lib/shipping";
import { Button } from "./ui/Button";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const { formatDisplayPrice } = usePricing();
  const isDark = resolvedTheme === "dark";
  const [isHovered, setIsHovered] = useState(false);
  const requiresVariantSelection = product.variants.some(
    (variant) => variant.options.length > 1
  );
  const isReplicaProduct = product.slug === "termo-stanley-40oz";
  const productHasFreeShipping = isProductShippingFree({
    id: product.id,
    slug: product.slug,
    free_shipping: product.free_shipping ?? null,
  });

  const discount = calculateDiscount(
    product.price,
    product.compare_at_price ?? 0
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      variant: null,
      quantity: 1,
      freeShipping: productHasFreeShipping,
      stockLocation: "nacional",
    });
  };

  const isNational = true;
  const coverImage = product.images[0] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/producto/${product.slug}`} className="block">
        <motion.article
          animate={isHovered ? { y: -6 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`relative rounded-2xl border overflow-hidden transition-colors duration-300 ${
            isDark
              ? "bg-[var(--surface)] border-white/[0.06]"
              : "bg-white border-[var(--border)]"
          }`}
          style={{
            boxShadow: isHovered
              ? isDark
                ? "0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.15)"
                : "0 20px 40px -12px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.1)"
              : isDark
                ? "0 1px 3px rgba(0,0,0,0.2)"
                : "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Shimmer sweep effect on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "200%", opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: isDark
                    ? "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)"
                    : "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 55%, transparent 60%)",
                  width: "60%",
                }}
              />
            )}
          </AnimatePresence>

          {/* Accent border glow on hover */}
          <motion.div
            animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{
              boxShadow: isDark
                ? "inset 0 0 0 1px rgba(34,197,94,0.2), 0 0 20px -6px rgba(34,197,94,0.1)"
                : "inset 0 0 0 1px rgba(34,197,94,0.15), 0 0 20px -6px rgba(34,197,94,0.08)",
            }}
          />

          {/* Product image */}
          <div
            className={`relative aspect-square overflow-hidden ${
              isDark
                ? "bg-gradient-to-br from-[#1a1b25] to-[#12131a]"
                : "bg-gradient-to-br from-[var(--surface-muted)] to-[#e8f0ea]"
            }`}
          >
            {coverImage ? (
              <motion.div
                className="relative w-full h-full"
                animate={isHovered ? { scale: 1.06 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Image
                  src={coverImage}
                  alt={product.name}
                  fill
                  className="object-contain p-3 sm:p-4"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={100}
                  unoptimized
                />
              </motion.div>
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent" />

            {/* Quick view overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-[5] flex items-center justify-center"
                  style={{
                    background: isDark
                      ? "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)"
                      : "radial-gradient(ellipse at center, rgba(0,0,0,0.08) 0%, transparent 70%)",
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className={`text-[11px] font-semibold tracking-wide px-4 py-1.5 rounded-full backdrop-blur-sm ${
                      isDark
                        ? "bg-white/10 text-white/90"
                        : "bg-black/5 text-black/60"
                    }`}
                  >
                    {t("productCard.viewProduct")}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Discount badge with pulse */}
            {discount > 0 && (
              <motion.span
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-2.5 left-2.5 z-[6] h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-bold bg-[var(--accent)] text-[#071a0a] shadow-lg"
                style={{
                  boxShadow: "0 2px 12px -2px rgba(34,197,94,0.4)",
                }}
              >
                -{discount}%
              </motion.span>
            )}

            {/* Shipping badge with truck animation */}
            <span
              className={`absolute top-2.5 right-2.5 z-[6] inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm ${
                isNational
                  ? isDark
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-emerald-50 text-emerald-700"
                  : isDark
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {isNational ? (
                <motion.span
                  className="inline-flex"
                  animate={isHovered ? { x: [0, 2, 0] } : { x: 0 }}
                  transition={{
                    duration: 0.8,
                    repeat: isHovered ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                >
                  <Truck className="w-3 h-3" />
                </motion.span>
              ) : null}
              <span className="hidden sm:inline">
                {isNational
                  ? t("productCard.national")
                  : t("productCard.international")}
              </span>
            </span>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 space-y-2">
            <h3
              className={`text-[13px] sm:text-sm leading-snug line-clamp-2 font-semibold ${
                isDark ? "text-white" : "text-[var(--foreground)]"
              }`}
            >
              {product.name}
            </h3>
            {isReplicaProduct && (
              <p
                className={`text-[10px] font-medium ${
                  isDark ? "text-amber-300/90" : "text-amber-700"
                }`}
              >
                Replica Triple A (no original)
              </p>
            )}

            <div className="flex items-baseline gap-2">
              <span
                suppressHydrationWarning
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
              >
                {formatDisplayPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <span
                  suppressHydrationWarning
                  className={`text-[11px] line-through ${
                    isDark ? "text-neutral-600" : "text-neutral-400"
                  }`}
                >
                  {formatDisplayPrice(product.compare_at_price)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[10px] font-semibold text-[var(--accent-strong)]">
                  -{discount}%
                </span>
              )}
            </div>

            <p
              className={`text-[11px] ${
                isDark ? "text-neutral-500" : "text-[var(--muted)]"
              }`}
            >
              {isNational
                ? t("productCard.nationalDispatch")
                : t("productCard.internationalDispatch")}
            </p>

            {/* Add to cart button: slide up on hover (desktop), always visible (mobile) */}
            <div className="overflow-hidden">
              <motion.div
                initial={false}
                animate={isHovered ? { height: "auto", opacity: 1 } : {}}
                className="hidden sm:block"
                style={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="pt-1">
                  <Button
                    onClick={requiresVariantSelection ? undefined : handleAddToCart}
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
              </motion.div>
              {/* Always visible on mobile */}
              <div className="sm:hidden pt-1">
                <Button
                  onClick={requiresVariantSelection ? undefined : handleAddToCart}
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
            </div>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  );
}
