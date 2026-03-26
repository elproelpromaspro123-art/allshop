"use client";

import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface DeliveryEstimate {
  min: number;
  max: number;
  range: string;
  department: string;
  city: string | null;
}

interface DeliveryEstimateCardProps {
  isLoadingEstimate: boolean;
  deliveryEstimate: DeliveryEstimate | null;
}

export function DeliveryEstimateCard({
  isLoadingEstimate,
  deliveryEstimate,
}: DeliveryEstimateCardProps) {
  const { t } = useLanguage();
  const daysLabel =
    deliveryEstimate && deliveryEstimate.min === deliveryEstimate.max
      ? `${deliveryEstimate.min} ${t("product.estimateBusinessDays")}`
      : deliveryEstimate
        ? `${deliveryEstimate.min}-${deliveryEstimate.max} ${t("product.estimateBusinessDays")}`
        : "";

  return (
    <div className="mb-5 rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      {isLoadingEstimate ? (
        <div className="space-y-3">
          <div className="h-4 w-40 rounded-full bg-gray-100" />
          <div className="h-9 rounded-2xl bg-gray-100" />
          <div className="h-3 w-56 rounded-full bg-gray-100" />
        </div>
      ) : deliveryEstimate ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Envio estimado
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                {daysLabel}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Cobertura activa
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Zona
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {deliveryEstimate.city
                  ? `${deliveryEstimate.city}, ${deliveryEstimate.department}`
                  : deliveryEstimate.department}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Rango
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {deliveryEstimate.range}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-semibold",
                deliveryEstimate.min <= 2
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {t("product.estimateLabel")}
            </span>
            <span>{deliveryEstimate.department}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">
            {t("product.estimateUnavailable")}
          </p>
          <p className="text-xs leading-6 text-gray-400">
            Seguimos mostrando el producto. Cuando la zona este disponible,
            veras la ventana exacta de entrega.
          </p>
        </div>
      )}
    </div>
  );
}
