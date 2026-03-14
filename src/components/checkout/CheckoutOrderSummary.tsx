"use client";

import Image from "next/image";
import {
  Trash2,
  Minus,
  Plus,
  Package,
  Loader2,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShippingBadge } from "@/components/ShippingBadge";
import { PaymentLogos } from "@/components/PaymentLogos";
import { DeliveryLogos } from "@/components/DeliveryLogos";
import { normalizeLegacyImagePath } from "@/lib/image-paths";
import { useLanguage } from "@/providers/LanguageProvider";
import type { CartItem } from "@/types";

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  hasOnlyFreeShipping: boolean;
  shippingType: "nacional" | "internacional" | "ambos";
  isLoading: boolean;
  isDisplayDifferentFromPayment: boolean;
  formatDisplayPrice: (price: number) => string;
  formatPaymentPrice: (price: number) => string;
  onCheckout: () => void;
  onUpdateQuantity: (productId: string, variant: string | null, quantity: number) => void;
  onRemoveItem: (productId: string, variant: string | null) => void;
}

export function CheckoutOrderSummary({
  items,
  subtotal,
  shippingCost,
  total,
  hasOnlyFreeShipping,
  shippingType,
  isLoading,
  isDisplayDifferentFromPayment,
  formatDisplayPrice,
  formatPaymentPrice,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
}: CheckoutOrderSummaryProps) {
  const { t } = useLanguage();

  const trustItems = [
    { Icon: ShieldCheck, text: t("checkout.securePayment") },
    { Icon: Waypoints, text: t("checkout.trackingIncluded") },
  ];

  return (
    <div className="rounded-[var(--card-radius)] border p-5 sm:p-6 lg:sticky lg:top-24 bg-white border-[var(--border)]">
      <h2
        className="text-base font-bold mb-4 text-[var(--foreground)]"
      >
        {t("checkout.orderSummary")}
      </h2>

      <div className="space-y-3 mb-5">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variant}`} className="flex gap-3">
            <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center bg-[var(--surface-muted)]">
              {item.image ? (
                <Image
                  src={normalizeLegacyImagePath(item.image)}
                  alt={item.name}
                  fill
                  className="object-contain p-1.5"
                  sizes="56px"
                  quality={70}
                />
              ) : (
                <Package className="w-5 h-5 text-[var(--muted-faint)] opacity-60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[var(--foreground)]">
                {item.name}
              </p>
              {item.variant && <p className="text-xs text-[var(--muted-soft)]">{item.variant}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.variant, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md border transition-colors border-[var(--border)] hover:bg-[var(--surface-muted)]"
                    type="button"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.variant, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md border transition-colors border-[var(--border)] hover:bg-[var(--surface-muted)]"
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {formatDisplayPrice(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.productId, item.variant)}
                    className="text-[var(--muted-faint)] hover:text-red-500 transition-colors"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ShippingBadge stockLocation={shippingType} compact className="mb-4" />

      <div className="border-t pt-4 space-y-2 border-[var(--border)]">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-soft)]">{t("checkout.subtotal")}</span>
          <span className="font-medium text-[var(--foreground)]">
            {formatDisplayPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-soft)]">{t("checkout.shipping")}</span>
          <span className={cn("font-medium", shippingCost === 0 && "text-[var(--accent-strong)]")}>
            {shippingCost === 0 ? t("checkout.free") : formatDisplayPrice(shippingCost)}
          </span>
        </div>
        {hasOnlyFreeShipping && (
          <p className="text-xs text-[var(--accent-strong)]">
            {t("checkout.freeShippingApplied")}
          </p>
        )}
        <div className="flex justify-between text-base font-bold pt-3 border-t border-[var(--border)]">
          <span>{t("checkout.total")}</span>
          <span>{formatDisplayPrice(total)}</span>
        </div>
        {isDisplayDifferentFromPayment && (
          <div className="text-right text-xs text-[var(--muted-soft)] pt-1">{formatPaymentPrice(total)}</div>
        )}
      </div>

      {/* Contra entrega trust badge */}
      <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-strong)]/15 bg-[var(--accent-strong)]/5 px-3 py-2.5 text-sm font-semibold text-[var(--accent-strong)]">
        {t("checkout.codBadge")}
      </div>

      <Button size="xl" className="w-full mt-3 gap-2 text-base font-bold shadow-[var(--shadow-action)]" onClick={onCheckout} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("checkout.processing")}
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            {t("checkout.confirmOrder")} - {formatPaymentPrice(total)}
          </>
        )}
      </Button>

      <div className="mt-4 space-y-2">
        {trustItems.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-xs text-[var(--muted-soft)]">
            <item.Icon className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t flex flex-col gap-3 border-[var(--border)]">
        <PaymentLogos variant="dark" size="sm" />
        <DeliveryLogos className="grayscale opacity-50 justify-start pb-1 scale-90 origin-left" />
      </div>
    </div>
  );
}

