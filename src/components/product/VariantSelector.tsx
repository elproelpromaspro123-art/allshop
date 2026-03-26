"use client";

import { startTransition } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { normalizeProductHintText as normalizeText } from "@/lib/product-image-hints";

interface VariantOption {
  name: string;
  options: string[];
}

interface VariantSelectorProps {
  variants: VariantOption[];
  selectedVariants: Record<string, string>;
  setSelectedVariants: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  stockByVariantOption: Map<string, number | null>;
  isSelectedColorOutOfStock: boolean;
  onColorSelect: () => void;
}

export function VariantSelector({
  variants,
  selectedVariants,
  setSelectedVariants,
  stockByVariantOption,
  isSelectedColorOutOfStock,
  onColorSelect,
}: VariantSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Variantes
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            Selecciona acabados y disponibilidad
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          {variants.length} grupos
        </span>
      </div>

      {variants.map((variant) => (
        <div key={variant.name} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-gray-900">
              {variant.name}
            </label>
            <span className="text-xs font-medium text-gray-400">
              {selectedVariants[variant.name]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => {
              const isColorVariant = normalizeText(variant.name) === "color";
              const optionStock = stockByVariantOption.get(normalizeText(option));
              const isOptionOutOfStock =
                isColorVariant &&
                typeof optionStock === "number" &&
                optionStock <= 0;
              const lowStock =
                typeof optionStock === "number" &&
                optionStock > 0 &&
                optionStock <= 3;
              const metaLabel = isOptionOutOfStock
                ? t("product.stockOut")
                : lowStock
                  ? t("product.stockLimited")
                  : typeof optionStock === "number"
                    ? t("product.stockUnits", { count: optionStock })
                    : t("product.stockUnavailable");

              return (
                <button
                  key={option}
                  onClick={() => {
                    if (isColorVariant) {
                      onColorSelect();
                    }
                    startTransition(() => {
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [variant.name]: option,
                      }));
                    });
                  }}
                  className={cn(
                    "group flex min-w-[7.5rem] flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-all",
                    selectedVariants[variant.name] === option
                      ? isOptionOutOfStock
                        ? "border-red-500 bg-red-50 text-red-800"
                        : "border-emerald-500 bg-emerald-500 text-[#071a0a] shadow-[0_16px_36px_rgba(16,185,129,0.15)]"
                      : isOptionOutOfStock
                        ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)]",
                  )}
                  type="button"
                  aria-pressed={selectedVariants[variant.name] === option}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{option}</span>
                    {selectedVariants[variant.name] === option ? (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
                        Activo
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      selectedVariants[variant.name] === option
                        ? "text-[#071a0a]/75"
                        : isOptionOutOfStock
                          ? "text-red-500"
                          : "text-gray-400",
                    )}
                  >
                    {metaLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {isSelectedColorOutOfStock && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("product.variantOutOfStockNote")}
        </p>
      )}
    </div>
  );
}
