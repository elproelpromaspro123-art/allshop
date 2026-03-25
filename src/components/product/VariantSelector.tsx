"use client";

import { startTransition } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  normalizeProductHintText as normalizeText,
} from "@/lib/product-image-hints";

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
    <>
      {variants.map((variant) => (
        <div key={variant.name} className="mb-5">
          <label className="text-sm font-semibold mb-2.5 block text-gray-900">
            {variant.name}:{" "}
            <span className="font-normal text-gray-400">
              {selectedVariants[variant.name]}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => {
              const isColorVariant = normalizeText(variant.name) === "color";
              const optionStock = stockByVariantOption.get(
                normalizeText(option),
              );
              const isOptionOutOfStock =
                isColorVariant &&
                typeof optionStock === "number" &&
                optionStock <= 0;
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
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                    selectedVariants[variant.name] === option
                      ? isOptionOutOfStock
                        ? "border-red-500 bg-red-100 text-red-800"
                        : "border-emerald-500 bg-emerald-500 text-[#071a0a]"
                      : isOptionOutOfStock
                        ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                        : "border-gray-200 text-gray-700 hover:border-emerald-700/40",
                  )}
                  type="button"
                >
                  {option}
                  {isOptionOutOfStock ? t("product.optionOutOfStock") : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {isSelectedColorOutOfStock && (
        <p className="mb-4 text-sm rounded-xl border px-4 py-3 border-red-200 bg-red-50 text-red-700">
          {t("product.variantOutOfStockNote")}
        </p>
      )}
    </>
  );
}
