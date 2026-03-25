"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CartShortcutBannerProps {
  showCheckoutShortcut: boolean;
  setShowCheckoutShortcut: (value: boolean) => void;
  cartItemCount: number;
  cartTotal: number;
  formatDisplayPrice: (price: number) => string;
  router: { push: (path: string) => void };
}

export function CartShortcutBanner({
  showCheckoutShortcut,
  setShowCheckoutShortcut,
  cartItemCount,
  cartTotal,
  formatDisplayPrice,
  router,
}: CartShortcutBannerProps) {
  return (
    <div
      suppressHydrationWarning
      className={`mb-5 rounded-xl border px-4 py-4 ${
        showCheckoutShortcut
          ? "border-emerald-300 bg-emerald-50/90"
          : "border-gray-200 bg-gray-100/65"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {showCheckoutShortcut
              ? "Producto en tu bolsa"
              : "Tu bolsa ya está lista"}
          </p>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            {cartItemCount} {cartItemCount === 1 ? "producto" : "productos"} ·{" "}
            {formatDisplayPrice(cartTotal)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showCheckoutShortcut ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckoutShortcut(false)}
              type="button"
            >
              Seguir viendo
            </Button>
          ) : null}
          <Button
            size="sm"
            className="gap-2"
            onClick={() => router.push("/checkout")}
            type="button"
            data-testid="product-checkout-shortcut"
          >
            <ChevronRight className="w-4 h-4" />
            {showCheckoutShortcut ? "Ir al checkout" : "Ver bolsa"}
          </Button>
        </div>
      </div>
    </div>
  );
}
