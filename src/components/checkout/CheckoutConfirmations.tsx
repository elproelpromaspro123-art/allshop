"use client";

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
    <div className="mt-4 rounded-[var(--card-radius)] border p-4 text-sm border-[var(--border)] bg-[var(--surface-muted)]">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--accent-strong)] rounded"
          checked={allConfirmed}
          onChange={(e) => handleChange(e.target.checked)}
        />
        <span className="text-[var(--muted-strong)] leading-relaxed">
          {t("checkout.confirmAddress")}
        </span>
      </label>
    </div>
  );
}

