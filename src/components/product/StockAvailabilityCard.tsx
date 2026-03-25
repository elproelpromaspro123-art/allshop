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

  return (
    <div className="rounded-3xl border p-4 sm:p-5 mb-4 bg-white border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          Disponibilidad actual
        </p>
      </div>
      {isLoadingStock ? (
        <p className="text-sm text-gray-400 min-h-[2rem]">
          Consultando disponibilidad...
        </p>
      ) : (
        <div className="space-y-2">
          {stockPayload?.live ? (
            <p className="text-sm text-gray-400">
              Stock total:{" "}
              <span className="font-semibold text-emerald-700">
                {stockPayload.total_stock ?? "N/D"}
              </span>
            </p>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {stockPayload.variants.map((variant) => {
                  const isOut =
                    typeof variant.stock === "number" && variant.stock <= 0;
                  return (
                    <div
                      key={`${variant.name}-${variant.variation_id}`}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs",
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
