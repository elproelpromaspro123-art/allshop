"use client";

import { AlertTriangle } from "lucide-react";
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
  return (
    <>
      <div
        className={cn(
          "mt-3 rounded-xl border p-3 space-y-2.5 text-sm",
          "border-[var(--border)] bg-[var(--surface-muted)]"
        )}
      >
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
            checked={confirmations.addressConfirmed}
            onChange={(e) => onChange("addressConfirmed", e.target.checked)}
          />
          <span className={cn("text-neutral-700")}>
            Confirmo que mi dirección y referencia están completas y correctas.
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
            checked={confirmations.availabilityConfirmed}
            onChange={(e) => onChange("availabilityConfirmed", e.target.checked)}
          />
          <span className={cn("text-neutral-700")}>
            Confirmo que habrá una persona para recibir el pedido y responder llamada de entrega.
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--accent-strong)]"
            checked={confirmations.productAcknowledged}
            onChange={(e) => onChange("productAcknowledged", e.target.checked)}
          />
          <span className={cn("text-neutral-700")}>
            Confirmo que revise las caracteristicas del producto y la variante antes de finalizar el pedido.
          </span>
        </label>
      </div>

    </>
  );
}
