"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CouponCodePanel } from "@/components/checkout/CouponCodePanel";
import { usePricing } from "@/providers/PricingProvider";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cart-ui";
import { evaluateCoupon } from "@/lib/coupons";
import { normalizeLegacyImagePath } from "@/lib/image-paths";
import {
  calculateNationalShippingCost,
  hasOnlyFreeShippingProducts,
} from "@/lib/shipping";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousPathnameRef = useRef(pathname);
  const items = useCartStore((store) => store.items);
  const couponCode = useCartStore((store) => store.couponCode);
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const setCouponCode = useCartStore((store) => store.setCouponCode);
  const clearCouponCode = useCartStore((store) => store.clearCouponCode);
  const updateQuantity = useCartStore((store) => store.updateQuantity);
  const removeItem = useCartStore((store) => store.removeItem);
  const isDrawerOpen = useCartUiStore((store) => store.isDrawerOpen);
  const closeDrawer = useCartUiStore((store) => store.closeDrawer);
  const { formatDisplayPrice } = usePricing();

  useScrollLock(isDrawerOpen);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const hasOnlyFreeShipping = useMemo(
    () =>
      hasOnlyFreeShippingProducts(
        items.map((item) => ({
          id: item.productId,
          slug: item.slug,
          freeShipping: item.freeShipping ?? null,
        })),
      ),
    [items],
  );
  const maxCustomShippingCost = useMemo(
    () =>
      items.reduce((max, item) => {
        if (item.freeShipping) return max;
        return item.shippingCost !== undefined && item.shippingCost !== null
          ? Math.max(max, item.shippingCost)
          : max;
      }, -1),
    [items],
  );
  const shippingCost = calculateNationalShippingCost({
    hasOnlyFreeShippingProducts: hasOnlyFreeShipping,
    baseShippingCost:
      maxCustomShippingCost >= 0 ? maxCustomShippingCost : undefined,
  });
  const couponApplication = useMemo(() => {
    if (!couponCode) return null;

    return evaluateCoupon({
      code: couponCode,
      subtotal,
      shippingCost,
      items: items.map((item) => ({
        id: item.productId,
        slug: item.slug || null,
        quantity: item.quantity,
      })),
    });
  }, [couponCode, items, shippingCost, subtotal]);
  const discountAmount = couponApplication?.ok
    ? couponApplication.totalDiscount
    : 0;
  const total = couponApplication?.ok
    ? couponApplication.discountedTotal
    : subtotal + shippingCost;

  useEffect(() => {
    if (previousPathnameRef.current !== pathname && isDrawerOpen) {
      closeDrawer();
    }
    previousPathnameRef.current = pathname;
  }, [closeDrawer, isDrawerOpen, pathname]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, isDrawerOpen]);

  if (!hasHydrated || !isDrawerOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar bolsa"
        className="fixed inset-0 z-[88] bg-[rgba(12,17,24,0.46)] backdrop-blur-sm"
        onClick={closeDrawer}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Bolsa de compra"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[89] flex w-full max-w-[28rem] flex-col border-l border-[rgba(23,19,15,0.08)] bg-[rgba(249,246,240,0.98)] shadow-[-18px_0_55px_rgba(10,14,24,0.18)] backdrop-blur-xl outline-none"
      >
        <div className="border-b border-[rgba(23,19,15,0.08)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-500">
                Bolsa Vortixy
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">
                Pedido listo para cerrar.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Revisa cantidades, elimina ruido y salta al checkout solo cuando
                la mezcla de productos ya esté clara.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full border border-[rgba(23,19,15,0.08)] bg-white/80 text-slate-700"
              onClick={closeDrawer}
              aria-label="Cerrar bolsa"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Contra entrega activo
            <span className="text-emerald-800/60">·</span>
            {itemCount} {itemCount === 1 ? "unidad" : "unidades"}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_18px_45px_rgba(23,19,15,0.08)]">
              <ShoppingBag className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mt-6 text-xl font-black tracking-[-0.04em] text-slate-950">
              Tu bolsa está vacía.
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Vuelve al catálogo y agrega productos antes de pasar al checkout.
            </p>
            <Button asChild size="lg" className="mt-6 gap-2">
              <Link href="/" onClick={closeDrawer}>
                Explorar catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
              {items.map((item) => (
                <article
                  key={`${item.productId}-${item.variant}`}
                  className="rounded-[1.4rem] border border-[rgba(23,19,15,0.08)] bg-white/88 p-3 shadow-[0_18px_44px_rgba(23,19,15,0.05)]"
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] border border-slate-100 bg-gradient-to-b from-white to-slate-50">
                      {item.image ? (
                        <Image
                          src={normalizeLegacyImagePath(item.image)}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                          quality={75}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-950">
                            {item.name}
                          </p>
                          {item.variant ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.variant}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variant)}
                          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variant,
                                item.quantity - 1,
                              )
                            }
                            aria-label={`Reducir cantidad de ${item.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-950">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variant,
                                item.quantity + 1,
                              )
                            }
                            aria-label={`Aumentar cantidad de ${item.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Total
                          </p>
                          <p className="text-sm font-black tracking-[-0.02em] text-slate-950">
                            {formatDisplayPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-[rgba(23,19,15,0.08)] bg-white/88 px-5 py-5 sm:px-6">
              <CouponCodePanel
                items={items.map((item) => ({
                  productId: item.productId,
                  slug: item.slug || null,
                  quantity: item.quantity,
                }))}
                subtotal={subtotal}
                shippingCost={shippingCost}
                appliedCode={couponCode}
                application={couponApplication}
                formatPrice={formatDisplayPrice}
                onApplyCode={setCouponCode}
                onClearCode={clearCouponCode}
                className="mb-4"
                compact
              />

              <div className="rounded-[1.4rem] border border-[rgba(23,19,15,0.08)] bg-[rgba(247,244,238,0.9)] px-4 py-4">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-950">
                    {formatDisplayPrice(subtotal)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>Envío estimado</span>
                  <span
                    className={cn(
                      "font-semibold",
                      shippingCost === 0 ? "text-emerald-700" : "text-slate-950",
                    )}
                  >
                    {shippingCost === 0
                      ? "Gratis"
                      : formatDisplayPrice(shippingCost)}
                  </span>
                </div>
                {discountAmount > 0 ? (
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                      <span>Descuento</span>
                      {couponApplication?.ok ? (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          {couponApplication.normalizedCode}
                        </p>
                      ) : null}
                    </div>
                    <span className="font-semibold text-emerald-700">
                      -{formatDisplayPrice(discountAmount)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgba(23,19,15,0.08)] pt-3">
                  <span className="text-sm font-semibold text-slate-950">
                    Total estimado
                  </span>
                  <span className="text-xl font-black tracking-[-0.04em] text-slate-950">
                    {formatDisplayPrice(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={closeDrawer}
                >
                  Seguir comprando
                </Button>
                <Button asChild size="lg" className="flex-1 gap-2">
                  <Link href="/checkout" onClick={closeDrawer}>
                    Ir al checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
