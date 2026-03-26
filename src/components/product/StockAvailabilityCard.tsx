"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface StockVariant {
  name: string;
  stock: number | null;
  variation_id: number | null;
}

interface StockPayload {
  live: boolean;
  total_stock: number | null;
  variants: StockVariant[];
  calculated_at?: string;
  message?: string;
}

interface StockAvailabilityCardProps {
  isLoadingStock: boolean;
  stockPayload: StockPayload | null;
  stockUpdatedAtLabel: string | null;
  selectedColorStock: { name: string; stock: number | null } | null;
}

export function StockAvailabilityCard({
  isLoadingStock,
  stockPayload,
  stockUpdatedAtLabel,
  selectedColorStock,
}: StockAvailabilityCardProps) {
  const { t } = useLanguage();
  const totalStock = stockPayload?.total_stock ?? null;
  const stockTone =
    typeof totalStock === "number"
      ? totalStock <= 0
        ? "danger"
        : totalStock <= 3
          ? "warning"
          : "success"
      : "neutral";

  return (
    <div className="mb-4 rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
            <ShieldCheck className="h-4 w-4 text-indigo-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Disponibilidad actual
            </p>
            <p className="text-xs text-gray-400">
              Estado sincronizado con el inventario operativo
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
            stockTone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : stockTone === "warning"
                ? "bg-amber-50 text-amber-700"
                : stockTone === "danger"
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-100 text-slate-600",
          )}
        >
          {stockTone === "success"
            ? "Buen nivel"
            : stockTone === "warning"
              ? "Quedan pocas"
              : stockTone === "danger"
                ? "Agotado"
                : "Pendiente"}
        </span>
      </div>
      {isLoadingStock ? (
        <div className="space-y-3">
          <div className="h-4 w-48 rounded-full bg-gray-100" />
          <div className="h-2.5 w-full rounded-full bg-gray-100" />
          <div className="h-10 rounded-2xl bg-gray-100" />
        </div>
      ) : (
        <div className="space-y-2">
          {stockPayload?.live ? (
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <p className="text-sm text-gray-400">
                  Stock total{" "}
                  <span className="font-semibold text-gray-900">
                    {totalStock ?? "N/D"}
                  </span>
                </p>
                <span className="text-xs font-semibold text-gray-400">
                  {totalStock === null
                    ? "Sin dato"
                    : totalStock <= 0
                      ? "Ultima unidad no disponible"
                      : totalStock <= 3
                        ? "Rotacion alta"
                        : "Reposicion saludable"}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    stockTone === "success"
                      ? "bg-emerald-500"
                      : stockTone === "warning"
                        ? "bg-amber-500"
                        : stockTone === "danger"
                          ? "bg-red-500"
                          : "bg-slate-400",
                  )}
                  style={{
                    width:
                      typeof totalStock === "number"
                        ? `${Math.min(100, Math.max(8, totalStock * 12))}%`
                        : "28%",
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {stockPayload?.message ||
                "Disponibilidad no visible en este momento."}
            </p>
          )}
          {stockUpdatedAtLabel && stockPayload?.live && (
            <p suppressHydrationWarning className="text-xs text-gray-400">
              {t("product.stockUpdatedLabel", {
                time: stockUpdatedAtLabel,
              })}
            </p>
          )}
          {Array.isArray(stockPayload?.variants) &&
            stockPayload.variants.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {stockPayload.variants.map((variant) => {
                  const isOut =
                    typeof variant.stock === "number" && variant.stock <= 0;
                  return (
                    <div
                      key={`${variant.name}-${variant.variation_id}`}
                      className={cn(
                        "rounded-2xl border px-3 py-2.5 text-xs",
                        isOut
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-gray-100",
                      )}
                    >
                      <p
                        className={cn(
                          "font-semibold",
                          isOut ? "text-red-700" : "text-gray-900",
                        )}
                      >
                        {variant.name}
                      </p>
                      <p className={cn(isOut ? "text-red-600" : "text-gray-400")}>
                        {typeof variant.stock === "number"
                          ? variant.stock <= 0
                            ? t("product.stockOut")
                            : t("product.stockUnits", { count: variant.stock })
                          : t("product.stockUnavailable")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          {selectedColorStock?.stock !== null &&
          selectedColorStock?.stock !== undefined ? (
            <p className="text-xs text-gray-400">
              {t("product.selectedColorLabel", {
                color: selectedColorStock.name,
              })}{" "}
              <span className="font-semibold text-emerald-700">
                {selectedColorStock.stock <= 0
                  ? t("product.stockOut")
                  : selectedColorStock.stock}
              </span>
              {selectedColorStock.stock > 0
                ? ` ${t("product.stockAvailableSuffix")}`
                : "."}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
