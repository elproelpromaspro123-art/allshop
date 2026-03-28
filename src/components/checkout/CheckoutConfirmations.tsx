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
  const { t } = useLanguage();
  const confirmLabel =
    t("checkout.confirmLabel") !== "checkout.confirmLabel"
      ? t("checkout.confirmLabel")
      : "Confirmaciones finales";

  const confirmationItems: Array<{
    field: keyof CheckoutConfirmationsProps["confirmations"];
    title: string;
    description: string;
  }> = [
    {
      field: "addressConfirmed",
      title: "Confirmo mi dirección y referencia",
      description: "Revisa que calle, barrio, ciudad y punto de entrega estén correctos.",
    },
    {
      field: "availabilityConfirmed",
      title: "Entiendo que el stock se valida al final",
      description: "La disponibilidad puede ajustarse antes de cerrar el pedido.",
    },
    {
      field: "productAcknowledged",
      title: "Verifiqué cantidades y producto antes de enviar",
      description: "Acepto revisar el resumen completo y confirmar el pedido manualmente.",
    },
  ];
  const completedCount = confirmationItems.filter(
    ({ field }) => confirmations[field],
  ).length;
  const allConfirmed = completedCount === confirmationItems.length;

  return (
    <div
      className={cn(
        "mt-2 rounded-2xl border px-5 py-5 text-sm shadow-sm transition-all duration-300",
        allConfirmed
          ? "border-emerald-300/60 bg-emerald-50/80"
          : "border-gray-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={cn(
                "h-4 w-4",
                allConfirmed ? "text-emerald-700" : "text-gray-500",
              )}
            />
            <p className="text-sm font-bold text-gray-900">{confirmLabel}</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Revisa cada punto antes de enviar. Esto evita cambios de último minuto.
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
            allConfirmed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-gray-50 text-gray-600",
          )}
        >
          {completedCount}/{confirmationItems.length} listos
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {confirmationItems.map((item) => {
          const checked = confirmations[item.field];

          return (
            <label
              key={item.field}
              htmlFor={`confirm-${item.field}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                checked
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-gray-200 bg-gray-50/70 hover:border-emerald-200 hover:bg-emerald-50/60",
              )}
            >
              <div className="relative mt-0.5">
                <input
                  id={`confirm-${item.field}`}
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(event) =>
                    onChange(item.field, event.target.checked)
                  }
                  aria-label={item.title}
                />
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200",
                    checked
                      ? "border-emerald-500 bg-emerald-500 shadow-sm"
                      : "border-gray-200 bg-white",
                  )}
                >
                  {checked ? (
                    <svg
                      className="h-3 w-3 text-white"
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
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                      checked
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {checked ? "Listo" : "Pendiente"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-4 rounded-2xl border px-4 py-3 text-sm",
          allConfirmed
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-gray-200 bg-gray-50 text-gray-600",
        )}
      >
        <p className="font-semibold">
          {allConfirmed
            ? "Listo para enviar tu pedido"
            : "Falta completar las confirmaciones"}
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          {allConfirmed
            ? "Ya puedes pasar al resumen y confirmar con total claridad."
            : "Completa cada confirmación para mantener el checkout consistente y sin sorpresas."}
        </p>
      </div>
    </div>
  );
}
