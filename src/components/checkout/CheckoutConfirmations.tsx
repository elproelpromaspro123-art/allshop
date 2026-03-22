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
        "panel-surface mt-2 p-5 text-sm transition-all duration-300",
        allConfirmed
          ? "border-emerald-300/60 bg-emerald-50/80"
          : "border-[var(--border)] bg-white",
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
                : "border-[var(--border)] bg-[var(--surface-muted)]",
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
                allConfirmed ? "text-emerald-700" : "text-[var(--muted)]",
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                allConfirmed
                  ? "text-[var(--foreground)]"
                  : "text-[var(--foreground)]",
              )}
            >
              {confirmLabel}
            </span>
          </div>
          <span className="text-xs leading-relaxed text-[var(--muted)]">
            {t("checkout.confirmAddress")}
          </span>
        </div>
      </label>
    </div>
  );
}
