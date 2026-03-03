"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Clock, Package, Truck } from "lucide-react";
import { calculateDiscount } from "@/lib/utils";
import { Button } from "./ui/Button";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { usePricing } from "@/providers/PricingProvider";

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
      stockLocation: product.stock_location,
    });
  };

  const isNational = product.stock_location === "nacional";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/producto/${product.slug}`} className="block">
        <article
          className={`rounded-2xl border overflow-hidden transition-all duration-200 ${isDark
              ? "bg-[var(--surface)] border-white/[0.06] hover:border-[var(--accent)]/25"
              : "bg-white border-[var(--border)] hover:border-[var(--accent-strong)]/30 hover:shadow-[0_12px_32px_-12px_rgba(73,204,104,0.2)]"
            }`}
        >
          {/* Image placeholder */}
          <div
            className={`relative aspect-square ${isDark
                ? "bg-gradient-to-br from-[#111827] to-[#0d1320]"
                : "bg-gradient-to-br from-[var(--surface-muted)] to-[#e8f0ea]"
              }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/[0.05]" : "bg-white/80"
                  }`}
              >
                <ShoppingBag
                  className={`w-6 h-6 ${isDark ? "text-neutral-600" : "text-neutral-300"
                    }`}
                />
              </div>
            </div>

            {/* Badges */}
            {discount > 0 && (
              <span className="absolute top-2.5 left-2.5 h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-bold bg-[var(--accent)] text-[#071a0a]">
                -{discount}%
              </span>
            )}

            <span
              className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${isNational
                  ? isDark
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-emerald-50 text-emerald-700"
                  : isDark
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-amber-50 text-amber-700"
                }`}
            >
              {isNational ? (
                <Truck className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {isNational
                  ? t("productCard.national")
                  : t("productCard.international")}
              </span>
            </span>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 space-y-2.5">
            <h3
              className={`text-[13px] sm:text-sm leading-snug line-clamp-2 font-semibold ${isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
            >
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span
                suppressHydrationWarning
                className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                {formatDisplayPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <span
                  suppressHydrationWarning
                  className="text-xs text-neutral-400 line-through"
                >
                  {formatDisplayPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            <p
              className={`text-[11px] ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                }`}
            >
              {isNational
                ? t("productCard.nationalDispatch")
                : t("productCard.internationalDispatch")}
            </p>

            <Button
              onClick={handleAddToCart}
              size="sm"
              className="w-full gap-1.5"
              aria-label={t("productCard.addToCart")}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {t("productCard.addToCart")}
            </Button>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
