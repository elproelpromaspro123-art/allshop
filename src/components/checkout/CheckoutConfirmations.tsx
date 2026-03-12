"use client";

import { cn } from "@/lib/utils";

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

  const handleChange = (checked: boolean) => {
    onChange("addressConfirmed", checked);
    onChange("availabilityConfirmed", checked);
    onChange("productAcknowledged", checked);
  };

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border p-3 text-sm",
        "border-[var(--border)] bg-[var(--surface-muted)]"
      )}
    >
      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
          checked={allConfirmed}
          onChange={(e) => handleChange(e.target.checked)}
        />
        <span className={cn("text-neutral-700")}>
          Confirmo que mis datos y dirección son correctos.
        </span>
      </label>
    </div>
  );
}
