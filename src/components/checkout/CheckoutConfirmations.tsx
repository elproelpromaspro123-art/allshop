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
  onChange: (field: keyof CheckoutConfirmationsProps["confirmations"], checked: boolean) => void;
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
        "mt-4 rounded-[var(--card-radius)] border-2 p-4 text-sm transition-all duration-300",
        allConfirmed
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-[var(--border)] bg-[var(--surface-muted)]"
      )}
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={allConfirmed}
            onChange={(e) => handleChange(e.target.checked)}
          />
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
              allConfirmed
                ? "bg-emerald-500 border-emerald-500 shadow-sm"
                : "border-[var(--border)] bg-white"
            )}
          >
            {allConfirmed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShieldCheck className={cn("w-3.5 h-3.5", allConfirmed ? "text-emerald-600" : "text-[var(--muted-faint)]")} />
            <span className={cn("text-sm font-semibold", allConfirmed ? "text-emerald-700" : "text-[var(--foreground)]")}>
              {t("checkout.confirmLabel") !== "checkout.confirmLabel" ? t("checkout.confirmLabel") : "Confirmo los datos"}
            </span>
          </div>
          <span className="text-[var(--muted-strong)] leading-relaxed text-xs">
            {t("checkout.confirmAddress")}
          </span>
        </div>
      </label>
    </div>
  );
}

