"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  Star,
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
import { TRUST_VISUALS } from "@/lib/trust-visuals";

interface Props {
  product: Product;
  category: Category | null;
  relatedProducts: Product[];
}

export function ProductPageClient({
  product,
  category,
  relatedProducts,
}: Props) {
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >(() => {
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
  const {
    formatDisplayPrice,
    formatPaymentPrice,
    isDisplayDifferentFromPayment,
  } = usePricing();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const discount = calculateDiscount(
    product.price,
    product.compare_at_price ?? 0
  );
  const variantString = Object.values(selectedVariants).join(" / ") || null;

  const trustItems = useMemo(
    () => [
      { image: TRUST_VISUALS.payment, text: t("product.trust1") },
      { image: TRUST_VISUALS.shipping, text: t("product.trust2") },
      { image: TRUST_VISUALS.returns, text: t("product.trust3") },
      { image: TRUST_VISUALS.support, text: t("product.trust4") },
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
      {/* Breadcrumb */}
      <div
        className={cn(
          "border-b",
          isDark
            ? "bg-[var(--surface)] border-white/[0.06]"
            : "bg-[var(--surface-muted)] border-[var(--border)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav
            className={cn(
              "flex items-center gap-1.5 text-xs sm:text-sm",
              isDark ? "text-neutral-500" : "text-[var(--muted)]"
            )}
          >
            <Link
              href="/"
              className={cn(
                "transition-colors",
                isDark ? "hover:text-white" : "hover:text-[var(--foreground)]"
              )}
            >
              {t("common.home")}
            </Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link
                  href={`/categoria/${category.slug}`}
                  className={cn(
                    "transition-colors",
                    isDark
                      ? "hover:text-white"
                      : "hover:text-[var(--foreground)]"
                  )}
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span
              className={cn(
                "font-medium truncate max-w-[140px] sm:max-w-[260px]",
                isDark ? "text-white" : "text-[var(--foreground)]"
              )}
            >
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main product section */}
      <section
        className={cn(
          "py-6 sm:py-10",
          isDark ? "bg-[#090d14]" : "bg-[var(--background)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
            {/* Image gallery */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden mb-3",
                  isDark ? "bg-[var(--surface)]" : "bg-[var(--surface-muted)]"
                )}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-neutral-400/40" />
                </div>
                {discount > 0 && (
                  <span className="absolute top-3 left-3 bg-[var(--accent)] text-[#071a0a] text-sm font-bold px-3 py-1.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      activeImage === i
                        ? "border-[var(--accent)]"
                        : isDark
                          ? "border-white/[0.06] hover:border-white/[0.15]"
                          : "border-[var(--border)] hover:border-[var(--accent-strong)]/40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center",
                        isDark ? "bg-[var(--surface)]" : "bg-[var(--surface-muted)]"
                      )}
                    >
                      <Package className="w-5 h-5 text-neutral-400/40" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="flex flex-col"
            >
              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3.5 h-3.5",
                        i < 4
                          ? "fill-amber-400 text-amber-400"
                          : "fill-amber-400/40 text-amber-400/40"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-neutral-500">
                  {t("product.ratingSummary", {
                    rating: "4.8",
                    count: 127,
                    reviews: t("product.reviews"),
                  })}
                </span>
              </div>

              <h1
                className={cn(
                  "text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-3",
                  isDark ? "text-white" : "text-[var(--foreground)]"
                )}
              >
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-5">
                <span
                  className={cn(
                    "text-2xl sm:text-3xl font-bold",
                    isDark ? "text-white" : "text-[var(--foreground)]"
                  )}
                >
                  {formatDisplayPrice(product.price)}
                </span>
                {product.compare_at_price && (
                  <>
                    <span className="text-base text-neutral-400 line-through">
                      {formatDisplayPrice(product.compare_at_price)}
                    </span>
                    <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-[var(--accent)] text-[#071a0a]">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              {isDisplayDifferentFromPayment && (
                <p className="text-xs text-neutral-500 -mt-3 mb-5">
                  {formatPaymentPrice(product.price)}
                </p>
              )}

              <ShippingBadge
                stockLocation={product.stock_location}
                className="mb-5"
              />

              {/* Variants */}
              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-5">
                  <label
                    className={cn(
                      "text-sm font-semibold mb-2.5 block",
                      isDark ? "text-white" : "text-[var(--foreground)]"
                    )}
                  >
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
                          "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                          selectedVariants[variant.name] === option
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[#071a0a]"
                            : isDark
                              ? "border-white/[0.1] text-neutral-300 hover:border-white/[0.2]"
                              : "border-[var(--border)] text-neutral-700 hover:border-[var(--accent-strong)]/40"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "flex items-center border rounded-full overflow-hidden",
                    isDark
                      ? "border-white/[0.1]"
                      : "border-[var(--border)]"
                  )}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center transition-colors",
                      isDark
                        ? "hover:bg-white/[0.05] text-neutral-300"
                        : "hover:bg-[var(--surface-muted)]"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center transition-colors",
                      isDark
                        ? "hover:bg-white/[0.05] text-neutral-300"
                        : "hover:bg-[var(--surface-muted)]"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t("product.addToCart")}
                </Button>
              </div>

              <Link href="/checkout">
                <Button
                  variant="outline"
                  size="lg"
                  className={`w-full mb-5 ${isDark
                      ? "border-white/[0.1] text-white hover:bg-white/[0.04]"
                      : ""
                    }`}
                  onClick={handleAddToCart}
                >
                  {t("product.buyNow")}
                </Button>
              </Link>

              {/* Trust items */}
              <div
                className={cn(
                  "space-y-2.5 mb-5 p-4 rounded-2xl",
                  isDark ? "bg-white/[0.03]" : "bg-[var(--surface-muted)]"
                )}
              >
                {trustItems.map((item) => (
                  <div
                    key={item.text}
                    className={cn(
                      "flex items-center gap-2.5 text-sm",
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    )}
                  >
                    <Image
                      src={item.image}
                      alt={item.text}
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px] rounded-full object-cover shrink-0"
                    />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Payment logos */}
              <div
                className={cn(
                  "pt-4 border-t",
                  isDark ? "border-white/[0.06]" : "border-[var(--border)]"
                )}
              >
                <p className="text-[11px] text-neutral-400 mb-3 font-semibold uppercase tracking-wider">
                  {t("product.acceptedPayments")}
                </p>
                <PaymentLogos
                  variant={isDark ? "light" : "dark"}
                  size="sm"
                />
              </div>
            </motion.div>
          </div>

          {/* Description */}
          <div className="mt-12 sm:mt-16 max-w-3xl">
            <h2
              className={cn(
                "text-xl font-bold mb-4",
                isDark ? "text-white" : "text-[var(--foreground)]"
              )}
            >
              {t("product.description")}
            </h2>
            <p
              className={cn(
                "leading-relaxed",
                isDark ? "text-neutral-400" : "text-neutral-600"
              )}
            >
              {product.description}
            </p>
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section
          className={cn(
            "py-14 sm:py-20 border-t",
            isDark
              ? "bg-[#0c1019] border-white/[0.06]"
              : "bg-[var(--surface)] border-[var(--border)]"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className={cn(
                "text-2xl font-bold mb-8",
                isDark ? "text-white" : "text-[var(--foreground)]"
              )}
            >
              {t("product.related")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust bar bottom */}
      <section
        className={cn(
          "py-10 border-t",
          isDark
            ? "bg-[#090d14] border-white/[0.06]"
            : "bg-[var(--background)] border-[var(--border)]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustBar />
        </div>
      </section>
    </>
  );
}
