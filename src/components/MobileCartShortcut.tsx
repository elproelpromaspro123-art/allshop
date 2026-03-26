"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePricing } from "@/providers/PricingProvider";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cart-ui";

export function MobileCartShortcut() {
  const items = useCartStore((store) => store.items);
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const openDrawer = useCartUiStore((store) => store.openDrawer);
  const { formatDisplayPrice } = usePricing();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!hasHydrated || itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[85] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 sm:hidden">
      <div className="flex items-center gap-2 rounded-[1.6rem] border border-white/10 bg-[rgba(8,19,15,0.92)] p-2 text-white shadow-[0_18px_45px_rgba(8,19,15,0.26)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => openDrawer("mobile-shortcut")}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-[1.3rem] px-2.5 py-2 text-left transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="Abrir bolsa de compra"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-emerald-300">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/85">
              Bolsa activa
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {itemCount} {itemCount === 1 ? "producto" : "productos"} ·{" "}
              {formatDisplayPrice(total)}
            </p>
          </div>
        </button>

        <Button asChild size="sm" className="shrink-0 gap-1.5 rounded-full px-4">
          <Link href="/checkout" aria-label="Ir al checkout">
            Ir al checkout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
