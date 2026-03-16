"use client";

import Image from "next/image";
import { ShoppingBag, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";

interface StickyAddToCartProps {
  price: number;
  productName: string;
  productImage: string;
  onAddToCart: () => void;
  requiresVariant: boolean;
}

export function StickyAddToCart({
  price,
  productName,
  productImage,
  onAddToCart,
  requiresVariant,
}: StickyAddToCartProps) {
  const { t } = useLanguage();
  const { formatDisplayPrice } = usePricing();

  const handleClick = () => {
    if (requiresVariant) {
      // Scroll to top to show variant selector
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onAddToCart();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-[var(--border)]" />
      
      {/* Content */}
      <div className="relative px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Product info */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[var(--surface-muted)] overflow-hidden shrink-0 border border-[var(--border-subtle)] relative">
              {productImage && (
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--foreground)] truncate">
                {productName}
              </p>
              <p className="text-sm font-bold text-[var(--accent-strong)]">
                {formatDisplayPrice(price)}
              </p>
            </div>
          </div>
          
          {/* Action button */}
          <Button
            size="lg"
            className="gap-2 shrink-0 shadow-lg shadow-emerald-500/25"
            onClick={handleClick}
          >
            <ShoppingBag className="w-4 h-4" />
            {requiresVariant
              ? t("productCard.selectVariant")
              : t("productCard.addToCart")}
          </Button>
        </div>
        
        {/* Scroll to top indicator */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-[var(--muted-soft)] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm hover:text-[var(--foreground)] transition-colors"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-3 h-3" />
          {t("product.scrollToTop")}
        </button>
      </div>
    </div>
  );
}
