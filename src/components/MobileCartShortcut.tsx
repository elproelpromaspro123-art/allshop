"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePricing } from "@/providers/PricingProvider";
import { useCartStore } from "@/store/cart";

export function MobileCartShortcut() {
  const items = useCartStore((store) => store.items);
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const { formatDisplayPrice } = usePricing();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!hasHydrated || itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[85] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 sm:hidden">
      <Link
        href="/checkout"
        className="group flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(8,19,15,0.92)] px-4 py-3 text-white shadow-[0_18px_45px_rgba(8,19,15,0.26)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
        aria-label="Ver pedido en la bolsa"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-emerald-300">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/85">
            Bolsa lista
          </p>
          <p className="truncate text-sm font-semibold text-white">
            {itemCount} {itemCount === 1 ? "producto" : "productos"} · {formatDisplayPrice(total)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-slate-950 transition-colors group-hover:bg-emerald-50">
          Ver pedido
        </span>
      </Link>
    </div>
  );
}
