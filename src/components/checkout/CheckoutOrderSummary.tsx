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
  onUpdateQuantity: (
    productId: string,
    variant: string | null,
    quantity: number,
  ) => void;
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
    {
      Icon: ShieldCheck,
      text: t("checkout.securePayment"),
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      Icon: Waypoints,
      text: t("checkout.trackingIncluded"),
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6 lg:sticky lg:top-28"
      data-testid="checkout-summary"
    >
      <div className="rounded-2xl bg-gray-900 px-5 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("checkout.orderSummary")}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-white/62">{t("checkout.total")}</p>
            <p className="text-3xl font-bold tracking-tight text-white">
              {formatDisplayPrice(total)}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/74">
            {items.length} producto{items.length === 1 ? "" : "s"}
          </div>
        </div>
        {isDisplayDifferentFromPayment && (
          <div className="mt-3 text-sm text-white/60">
            {formatPaymentPrice(total)}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variant}`}
            className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
          >
            <div className="flex gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-b from-white to-gray-50">
                {item.image ? (
                  <Image
                    src={normalizeLegacyImagePath(item.image)}
                    alt={item.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="56px"
                    quality={75}
                  />
                ) : (
                  <Package className="w-5 h-5 text-gray-300 opacity-60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {item.name}
                </p>
                {item.variant && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {item.variant}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) return;
                        onUpdateQuantity(
                          item.productId,
                          item.variant,
                          item.quantity - 1,
                        );
                      }}
                      disabled={isLoading || item.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none"
                      type="button"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(
                          item.productId,
                          item.variant,
                          item.quantity + 1,
                        )
                      }
                      disabled={isLoading}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none"
                      type="button"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDisplayPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.productId, item.variant)}
                      disabled={isLoading}
                      className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40 disabled:pointer-events-none"
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ShippingBadge
        stockLocation={shippingType}
        compact
        className="mt-4 mb-4"
      />

      <div className="rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {t("checkout.subtotal")}
            </span>
            <span className="font-medium text-gray-900">
              {formatDisplayPrice(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {t("checkout.shipping")}
            </span>
            <span
              className={cn(
                "font-medium",
                shippingCost === 0 && "text-emerald-700",
              )}
            >
              {shippingCost === 0
                ? t("checkout.free")
                : formatDisplayPrice(shippingCost)}
            </span>
          </div>
          {hasOnlyFreeShipping && (
            <p className="text-xs text-emerald-700">
              {t("checkout.freeShippingApplied")}
            </p>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold">
            <span className="text-gray-900">
              {t("checkout.total")}
            </span>
            <span className="text-gray-900">
              {formatDisplayPrice(total)}
            </span>
          </div>
          {isDisplayDifferentFromPayment && (
            <div className="text-right text-xs text-gray-400 pt-1">
              {formatPaymentPrice(total)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <ShieldCheck className="w-4 h-4" />
        {t("checkout.codBadge")}
      </div>

      <Button
        size="xl"
        className="mt-4 hidden w-full gap-2 text-base font-bold shadow-lg lg:flex"
        onClick={onCheckout}
        disabled={isLoading}
      >
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

      <p className="mt-4 text-center text-xs text-gray-500 lg:hidden">
        Revisa el total y confirma desde la barra fija inferior.
      </p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {trustItems.map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50/55 px-3 py-2.5 text-xs text-gray-400"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-md ${item.color}`}
            >
              <item.Icon className="w-3 h-3 shrink-0" />
            </div>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5">
        <PaymentLogos variant="dark" size="sm" />
        <DeliveryLogos className="grayscale opacity-50 justify-start pb-1 scale-90 origin-left" />
      </div>
    </div>
  );
}
