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

  const handleChange = (checked: boolean) => {
    onChange("addressConfirmed", checked);
    onChange("availabilityConfirmed", checked);
    onChange("productAcknowledged", checked);
  };

  return (
    <div
      className={cn(
        "surface-panel-dark surface-ambient brand-v-slash mt-2 p-5 text-sm text-white transition-all duration-300",
        allConfirmed ? "border-emerald-400/30" : "border-white/10",
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
            aria-label={t("checkout.confirmLabel")}
          />
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
              allConfirmed
                ? "bg-emerald-500 border-emerald-500 shadow-sm"
                : "border-white/20 bg-white/6",
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
                allConfirmed ? "text-emerald-300" : "text-white/55",
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                allConfirmed ? "text-white" : "text-white",
              )}
            >
              {t("checkout.confirmLabel") !== "checkout.confirmLabel"
                ? t("checkout.confirmLabel")
                : "Confirmo los datos"}
            </span>
          </div>
          <span className="text-xs leading-relaxed text-white/70">
            {t("checkout.confirmAddress")}
          </span>
        </div>
      </label>
    </div>
  );
}
