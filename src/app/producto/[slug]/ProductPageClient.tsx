"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  Star,
  Shield,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
} from "lucide-react";
import { cn, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { TrustBar } from "@/components/TrustBar";
import { PaymentLogos } from "@/components/PaymentLogos";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useTheme } from "@/providers/ThemeProvider";
import type { Product, Category } from "@/types";

interface Props {
  product: Product;
  category: Category | null;
  relatedProducts: Product[];
}

export function ProductPageClient({ product, category, relatedProducts }: Props) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.variants.forEach((v) => {
      if (v.options.length > 0) initial[v.name] = v.options[0];
    });
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useLanguage();
  const { formatDisplayPrice, formatPaymentPrice, isDisplayDifferentFromPayment } = usePricing();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const discount = calculateDiscount(product.price, product.compare_at_price ?? 0);
  const variantString = Object.values(selectedVariants).join(" / ") || null;

  const trustItems = useMemo(
    () => [
      { icon: Shield, text: t("product.trust1") },
      { icon: Truck, text: t("product.trust2") },
      { icon: RotateCcw, text: t("product.trust3") },
      { icon: CheckCircle2, text: t("product.trust4") },
    ],
    [t]
  );

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      variant: variantString,
      quantity,
      stockLocation: product.stock_location,
    });
  };

  return (
    <>
      <div className={cn("border-b", isDark ? "bg-[#0f1622] border-white/10" : "bg-[#eff6f2] border-[var(--border)]")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className={cn("flex items-center gap-1.5 text-xs sm:text-sm", isDark ? "text-neutral-400" : "text-neutral-500")}>
            <Link href="/" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-neutral-900")}>
              {t("common.home")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-neutral-900")}
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className={cn("font-medium truncate max-w-[160px] sm:max-w-[260px]", isDark ? "text-white" : "text-neutral-900")}>
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <section className={cn("py-8 sm:py-12", isDark ? "bg-[#0b0f14]" : "bg-[var(--surface)]")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={cn("relative aspect-square rounded-2xl overflow-hidden mb-4", isDark ? "bg-[#162030]" : "bg-[#edf4f0]")}>
                <div className={cn("w-full h-full flex items-center justify-center", isDark ? "bg-gradient-to-br from-[#1a2736] to-[#111826]" : "bg-gradient-to-br from-[#ebf5ef] to-[#dcece2]")}>
                  <Package className="w-20 h-20 text-neutral-400" />
                </div>
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-[#183726] text-[#96f2ab] text-sm font-bold px-3 py-1.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      activeImage === i
                        ? isDark
                          ? "border-[var(--accent)]"
                          : "border-[var(--accent-strong)]"
                        : isDark
                          ? "border-white/10 hover:border-white/25"
                          : "border-[var(--border)] hover:border-[var(--accent)]/60"
                    )}
                  >
                    <div className={cn("w-full h-full flex items-center justify-center", isDark ? "bg-[#152132]" : "bg-[#edf4f0]")}>
                      <Package className="w-6 h-6 text-neutral-400" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < 4
                          ? "fill-amber-400 text-amber-400"
                          : "fill-amber-400/50 text-amber-400/50"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">
                  {t("product.ratingSummary", { rating: "4.8", count: 127, reviews: t("product.reviews") })}
                </span>
              </div>

              <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight mb-2", isDark ? "text-white" : "text-neutral-900")}>
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <span className={cn("text-3xl font-bold", isDark ? "text-white" : "text-neutral-900")}>
                  {formatDisplayPrice(product.price)}
                </span>
                {product.compare_at_price && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">
                      {formatDisplayPrice(product.compare_at_price)}
                    </span>
                    <span className={cn("px-2.5 py-1 text-sm font-bold rounded-full", isDark ? "bg-[#1b3226] text-[#96f2ab]" : "bg-[#e8f8ec] text-[#1f8f45]")}>
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              {isDisplayDifferentFromPayment && (
                <p className="text-xs text-neutral-500 mb-6">
                  {formatPaymentPrice(product.price)}
                </p>
              )}

              <ShippingBadge stockLocation={product.stock_location} className="mb-6" />

              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-6">
                  <label className={cn("text-sm font-semibold mb-3 block", isDark ? "text-white" : "text-neutral-900")}>
                    {variant.name}:{" "}
                    <span className="font-normal text-neutral-500">
                      {selectedVariants[variant.name]}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [variant.name]: option,
                          }))
                        }
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all",
                          selectedVariants[variant.name] === option
                            ? isDark
                              ? "border-[var(--accent)] bg-[var(--accent)] text-[#07220e]"
                              : "border-[var(--accent-strong)] bg-[var(--accent)] text-[#07220e]"
                            : isDark
                              ? "border-white/15 text-neutral-300 hover:border-white/30"
                              : "border-[var(--border)] text-neutral-700 hover:border-[var(--accent)]/60"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 mb-6">
                <div className={cn("flex items-center border-2 rounded-xl overflow-hidden", isDark ? "border-white/15" : "border-[var(--border)]")}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={cn("w-11 h-11 flex items-center justify-center transition-colors", isDark ? "hover:bg-white/10 text-neutral-200" : "hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_11%)]")}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className={cn("w-11 h-11 flex items-center justify-center transition-colors", isDark ? "hover:bg-white/10 text-neutral-200" : "hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_11%)]")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                  <ShoppingBag className="w-5 h-5" />
                  {t("product.addToCart")}
                </Button>
              </div>

              <Link href="/checkout">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full mb-6"
                  onClick={handleAddToCart}
                >
                  {t("product.buyNow")}
                </Button>
              </Link>

              <div className={cn("space-y-3 mb-6 p-4 rounded-2xl", isDark ? "bg-white/5" : "bg-[#edf4f0]")}>
                {trustItems.map((item) => (
                  <div key={item.text} className={cn("flex items-center gap-2.5 text-sm", isDark ? "text-neutral-300" : "text-neutral-600")}>
                    <item.icon className="w-4 h-4 text-[var(--accent-strong)] flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className={cn("pt-4 border-t", isDark ? "border-white/10" : "border-[var(--border)]")}>
                <p className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wider">
                  {t("product.acceptedPayments")}
                </p>
                <PaymentLogos variant={isDark ? "light" : "dark"} size="sm" />
              </div>
            </motion.div>
          </div>

          <div className="mt-16 max-w-3xl">
            <h2 className={cn("text-xl font-bold mb-4", isDark ? "text-white" : "text-neutral-900")}>{t("product.description")}</h2>
            <p className={cn("leading-relaxed", isDark ? "text-neutral-300" : "text-neutral-600")}>{product.description}</p>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className={cn("py-16 border-t", isDark ? "bg-[#0f1622] border-white/10" : "bg-[#eff6f2] border-[var(--border)]")}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className={cn("text-2xl font-bold mb-8", isDark ? "text-white" : "text-neutral-900")}>
              {t("product.related")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={cn("py-12 border-t", isDark ? "bg-[#0b0f14] border-white/10" : "bg-[var(--surface)] border-[var(--border)]")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
