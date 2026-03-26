"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

interface CheckoutMobileStickyBarProps {
  total: string;
  isLoading: boolean;
  isLoadingEstimate?: boolean;
  itemCount?: number;
  reservationLabel?: string;
  deliveryLabel?: string | null;
  discountLabel?: string | null;
  onCheckout: () => void;
}

export function CheckoutMobileStickyBar({
  total,
  isLoading,
  isLoadingEstimate = false,
  itemCount,
  reservationLabel,
  deliveryLabel,
  discountLabel,
  onCheckout,
}: CheckoutMobileStickyBarProps) {
  const { t } = useLanguage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isDisabled = isLoading || isLoadingEstimate;

  return (
    <div
      data-testid="checkout-sticky-bar"
      className="fixed bottom-0 left-0 right-0 z-[50] border-t border-white/10 bg-[rgba(8,19,15,0.92)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] text-white shadow-[0_-8px_30px_rgba(10,15,30,0.16)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-medium text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              {t("checkout.securePurchase") !== "checkout.securePurchase"
                ? t("checkout.securePurchase")
                : "Compra protegida"}
              {itemCount != null && itemCount > 0 ? (
                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/72">
                  <ShoppingBag className="h-2.5 w-2.5" />
                  {itemCount}
                </span>
              ) : null}
            </div>
            <div className="truncate text-lg font-bold text-white">{total}</div>
            <p className="mt-0.5 text-[11px] leading-5 text-white/62">
              Contra entrega y validacion manual antes de confirmar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((previous) => !previous)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white"
            aria-expanded={detailsOpen}
            aria-label="Ver detalles del resumen"
          >
            {detailsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>

          <Button
            size="lg"
            className="shrink-0 gap-2 text-sm font-bold shadow-lg"
            onClick={onCheckout}
            disabled={isDisabled}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {isLoadingEstimate ? "Calculando..." : t("checkout.confirm")}
          </Button>
        </div>

        {detailsOpen ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/82">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
                  Ventana de cierre
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {reservationLabel || "--:--"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/52">
                  Entrega estimada
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {deliveryLabel || "Se calcula con tu ciudad"}
                </p>
              </div>
            </div>
            {discountLabel ? (
              <div className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Ahorro activo
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {discountLabel}
                </p>
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-white/60">
              Revisa la direccion, confirma las casillas y continua solo cuando todo este listo.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
