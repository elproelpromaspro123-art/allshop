"use client";

import Image from "next/image";
import {
  Clock3,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
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
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  hasOnlyFreeShipping: boolean;
  shippingType: "nacional" | "internacional" | "ambos";
  isLoading: boolean;
  isDisplayDifferentFromPayment: boolean;
  reservationCountdownLabel: string;
  deliveryWindowLabel: string | null;
  formatDisplayPrice: (price: number) => string;
  formatPaymentPrice: (price: number) => string;
  onCheckout: () => void;
  onUpdateQuantity: (
    productId: string,
    variant: string | null,
    quantity: number,
  ) => void;
  onRemoveItem: (productId: string, variant: string | null) => void;
  onJumpToSection: (sectionId: string) => void;
}

export function CheckoutOrderSummary({
  items,
  itemCount,
  subtotal,
  shippingCost,
  discountAmount,
  couponCode,
  total,
  hasOnlyFreeShipping,
  shippingType,
  isLoading,
  isDisplayDifferentFromPayment,
  reservationCountdownLabel,
  deliveryWindowLabel,
  formatDisplayPrice,
  formatPaymentPrice,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
  onJumpToSection,
}: CheckoutOrderSummaryProps) {
  const { t } = useLanguage();

  const shippingTypeLabel =
    shippingType === "nacional"
      ? "Cobertura nacional"
      : shippingType === "internacional"
        ? "Cobertura internacional"
        : "Cobertura mixta";

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
      <div className="rounded-[1.6rem] bg-gray-900 px-5 py-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            {t("checkout.orderSummary")}
          </p>
          <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/74">
            {itemCount} unidad{itemCount === 1 ? "" : "es"}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-white/62">{t("checkout.total")}</p>
            <p className="text-3xl font-bold tracking-tight text-white">
              {formatDisplayPrice(total)}
            </p>
            {isDisplayDifferentFromPayment ? (
              <p className="mt-1 text-xs text-white/60">
                Pago real: {formatPaymentPrice(total)}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Ventana de cierre
            </p>
            <p className="mt-1 text-lg font-black tracking-[-0.04em] text-white">
              {reservationCountdownLabel}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-white/68">
          Contra entrega, validacion manual y resumen editable antes de cerrar.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Entrega estimada
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {deliveryWindowLabel || "Se calcula con tu departamento"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Operacion
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Contra entrega - validacion manual
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
              Items
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {itemCount} producto{itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
              Cobertura
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {shippingTypeLabel}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
              Reserva
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {reservationCountdownLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onJumpToSection("checkout-contacto")}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
        >
          Contacto
        </button>
        <button
          type="button"
          onClick={() => onJumpToSection("checkout-envio")}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
        >
          Envio
        </button>
        <button
          type="button"
          onClick={() => onJumpToSection("checkout-confirmaciones")}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
        >
          Confirmacion
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variant}`}
            className="rounded-[1.15rem] border border-gray-100 bg-gray-50/60 p-3 shadow-[0_1px_0_rgba(255,255,255,0.4)]"
          >
            <div className="flex gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50">
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
                  <Package className="h-5 w-5 text-gray-300 opacity-60" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </p>
                    {item.variant ? (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {item.variant}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.productId, item.variant)}
                    disabled={isLoading}
                    className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-40"
                    type="button"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2">
                  <ShippingBadge
                    stockLocation={item.stockLocation}
                    compact
                    className="text-[10px]"
                  />
                </div>

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
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
                      type="button"
                      aria-label={`Disminuir cantidad de ${item.name}`}
                    >
                      <Minus className="h-3 w-3" />
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
                      type="button"
                      aria-label={`Aumentar cantidad de ${item.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="block text-sm font-semibold text-gray-900">
                      {formatDisplayPrice(item.price * item.quantity)}
                    </span>
                    <span className="block text-[11px] text-gray-400">
                      {formatDisplayPrice(item.price)} c/u
                    </span>
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
        className="mb-4 mt-4"
      />

      <div className="rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t("checkout.subtotal")}</span>
            <span className="font-medium text-gray-900">
              {formatDisplayPrice(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t("checkout.shipping")}</span>
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
          {discountAmount > 0 ? (
            <div className="flex justify-between text-sm">
              <div className="space-y-1">
                <span className="text-gray-400">{t("checkout.discount")}</span>
                {couponCode ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    {couponCode}
                  </p>
                ) : null}
              </div>
              <span className="font-medium text-emerald-700">
                -{formatDisplayPrice(discountAmount)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold">
            <span className="text-gray-900">{t("checkout.total")}</span>
            <span className="text-gray-900">{formatDisplayPrice(total)}</span>
          </div>
          {isDisplayDifferentFromPayment && (
            <div className="pt-1 text-right text-xs text-gray-400">
              {formatPaymentPrice(total)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {t("checkout.codBadge")}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-800/80">
          <Clock3 className="h-3.5 w-3.5" />
          {reservationCountdownLabel}
        </span>
      </div>

      <Button
        size="xl"
        className="mt-4 hidden w-full gap-2 text-base font-bold shadow-lg lg:flex"
        onClick={onCheckout}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("checkout.processing")}
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5" />
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
              <item.Icon className="h-3 w-3 shrink-0" />
            </div>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5">
        <PaymentLogos variant="dark" size="sm" />
        <DeliveryLogos className="origin-left justify-start scale-90 grayscale pb-1 opacity-50" />
      </div>
    </div>
  );
}
