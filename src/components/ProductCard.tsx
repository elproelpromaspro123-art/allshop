"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Clock, Package, ShieldCheck } from "lucide-react";
import { calculateDiscount } from "@/lib/utils";
import { ShippingBadge } from "./ShippingBadge";
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

  const discount = calculateDiscount(product.price, product.compare_at_price ?? 0);

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

  const stockStatus = product.stock_location === "nacional" ? "in_stock" : "imported";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group"
    >
      <Link href={`/producto/${product.slug}`} className="block">
        <article
          className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
            isDark
              ? "bg-[#12161b] border-white/10 hover:border-[var(--accent)]/40"
              : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]/50 shadow-[0_14px_34px_-28px_rgba(73,204,104,0.7)]"
          }`}
        >
          <div
            className={`relative aspect-square ${
              isDark ? "bg-gradient-to-br from-[#1a2027] to-[#13181e]" : "bg-gradient-to-br from-[#eff7f2] to-[#e7f0ea]"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/10" : "bg-white shadow-sm"}`}>
                <ShoppingBag className={`w-7 h-7 ${isDark ? "text-white/80" : "text-neutral-400"}`} />
              </div>
            </div>

            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {discount > 0 && (
                <span className="h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-semibold bg-[#183726] text-[#96f2ab]">
                  -{discount}%
                </span>
              )}
            </div>

            <div className="absolute top-3 right-3">
              {stockStatus === "in_stock" ? (
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
                  <Package className="w-3 h-3" />
                  {t("productCard.national")}
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                  <Clock className="w-3 h-3" />
                  {t("productCard.international")}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ShippingBadge stockLocation={product.stock_location} compact />
              <span className={`inline-flex items-center gap-1 text-[10px] ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>
                <ShieldCheck className="w-3 h-3" />
                {t("productCard.protectedPayment")}
              </span>
            </div>

            <h3 className={`text-sm leading-snug line-clamp-2 font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>
              {product.name}
            </h3>

            <div className="flex items-end gap-2">
              <span suppressHydrationWarning className={`text-lg font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>
                {formatDisplayPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <span suppressHydrationWarning className="text-xs text-neutral-400 line-through mb-0.5">
                  {formatDisplayPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            <p className={`text-[11px] ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              {stockStatus === "in_stock"
                ? t("productCard.nationalDispatch")
                : t("productCard.internationalDispatch")}
            </p>

            <Button
              onClick={handleAddToCart}
              className={`w-full h-10 text-sm ${
                isDark
                  ? "bg-[var(--accent)] text-[#08210f] hover:bg-[var(--accent-strong)] hover:text-white"
                  : "bg-[var(--accent)] text-[#08210f] hover:bg-[var(--accent-strong)] hover:text-white"
              }`}
              aria-label={t("productCard.addToCart")}
            >
              <ShoppingBag className="w-4 h-4" />
              {t("productCard.addToCart")}
            </Button>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
