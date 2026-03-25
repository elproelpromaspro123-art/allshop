"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface CheckoutConfirmationsProps {
  confirmations: {
    addressConfirmed: boolean;
    availabilityConfirmed: boolean;
    productAcknowledged: boolean;
  };
  onChange: (
    field: keyof CheckoutConfirmationsProps["confirmations"],
    checked: boolean,
  ) => void;
}

export function CheckoutConfirmations({
  confirmations,
  onChange,
}: CheckoutConfirmationsProps) {
  const allConfirmed = confirmations.addressConfirmed;
  const { t } = useLanguage();
  const confirmLabel =
    t("checkout.confirmLabel") !== "checkout.confirmLabel"
      ? t("checkout.confirmLabel")
      : "Confirmo los datos";

  const handleChange = (checked: boolean) => {
    onChange("addressConfirmed", checked);
    onChange("availabilityConfirmed", checked);
    onChange("productAcknowledged", checked);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm mt-2 text-sm transition-all duration-300",
        allConfirmed
          ? "border-emerald-300/60 bg-emerald-50/80"
          : "border-gray-200 bg-white",
      )}
    >
      <label htmlFor="address-confirmed" className="flex items-start gap-3 cursor-pointer">
        <div className="relative mt-0.5">
          <input
            id="address-confirmed"
            type="checkbox"
            className="sr-only peer"
            checked={allConfirmed}
            onChange={(e) => handleChange(e.target.checked)}
            aria-label={confirmLabel}
          />
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
              allConfirmed
                ? "border-emerald-500 bg-emerald-500 shadow-sm"
                : "border-gray-200 bg-gray-50",
            )}
          >
            {allConfirmed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShieldCheck
              className={cn(
                "w-3.5 h-3.5",
                allConfirmed ? "text-emerald-700" : "text-gray-500",
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                allConfirmed
                  ? "text-gray-900"
                  : "text-gray-900",
              )}
            >
              {confirmLabel}
            </span>
          </div>
          <span className="text-xs leading-relaxed text-gray-500">
            {t("checkout.confirmAddress")}
          </span>
        </div>
      </label>
    </div>
  );
}
