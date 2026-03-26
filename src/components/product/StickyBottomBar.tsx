"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { useCartUiStore } from "@/store/cart-ui";

interface StickyBottomBarProps {
  productPrice: number;
  quantity: number;
  productHasFreeShipping: boolean;
  hasStableCartShortcut: boolean;
  shouldPrioritizeCheckoutShortcut: boolean;
  showCheckoutShortcut: boolean;
  setShowCheckoutShortcut: (value: boolean) => void;
  isSelectedColorOutOfStock: boolean;
  cartItemCount: number;
  cartTotal: number;
  formatDisplayPrice: (price: number) => string;
  onAddToCart: (options?: { openCheckout?: boolean }) => void;
  router: { push: (path: string) => void };
}

export function StickyBottomBar({
  productPrice,
  quantity,
  productHasFreeShipping,
  hasStableCartShortcut,
  shouldPrioritizeCheckoutShortcut,
  showCheckoutShortcut,
  setShowCheckoutShortcut,
  isSelectedColorOutOfStock,
  cartItemCount,
  cartTotal,
  formatDisplayPrice,
  onAddToCart,
  router,
}: StickyBottomBarProps) {
  const { t } = useLanguage();
  const openDrawer = useCartUiStore((store) => store.openDrawer);

  return (
    <div
      data-testid="product-sticky-bar"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-[rgba(8,19,15,0.92)] p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] text-white backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.16)] sm:hidden animate-fade-in-up"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/85">
            {shouldPrioritizeCheckoutShortcut
              ? "Bolsa lista · Ir al checkout"
              : productHasFreeShipping
                ? "Envío gratis · Compra directa"
                : "Contra entrega · Compra directa"}
          </p>
          <p suppressHydrationWarning className="truncate text-base font-bold text-white">
            {shouldPrioritizeCheckoutShortcut
              ? `${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"} · ${formatDisplayPrice(cartTotal)}`
              : formatDisplayPrice(productPrice * quantity)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasStableCartShortcut ? (
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
              onClick={
                showCheckoutShortcut
                  ? () => setShowCheckoutShortcut(false)
                  : () => openDrawer("product-sticky")
              }
              type="button"
              data-testid="product-sticky-bag-shortcut"
            >
              {showCheckoutShortcut ? "Seguir" : "Ver bolsa"}
            </Button>
          ) : null}

          <Button
            size="sm"
            className="gap-2 shadow-[0_8px_20px_rgba(0,190,110,0.25)]"
            onClick={
              shouldPrioritizeCheckoutShortcut
                ? () => router.push("/checkout")
                : () => onAddToCart({ openCheckout: true })
            }
            disabled={
              shouldPrioritizeCheckoutShortcut ? false : isSelectedColorOutOfStock
            }
            type="button"
            data-testid="product-sticky-primary"
          >
            <ChevronRight className="w-4 h-4" />
            {shouldPrioritizeCheckoutShortcut
              ? "Ir al checkout"
              : isSelectedColorOutOfStock
                ? t("product.outOfStockCta")
                : t("product.buyNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
