"use client";

import { Clock3 } from "lucide-react";
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

  return (
    <div className="rounded-3xl border p-4 sm:p-5 mb-5 bg-white border-gray-200 shadow-sm">
      {isLoadingEstimate ? (
        <p className="text-sm text-gray-400 min-h-[4.5rem]">
          {t("product.estimateLoading")}
        </p>
      ) : deliveryEstimate ? (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{t("product.estimateLabel")}</span>
            <span className="font-semibold text-emerald-700">
              {deliveryEstimate.min} {t("product.estimateTo")}{" "}
              {deliveryEstimate.max} {t("product.estimateBusinessDays")}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            {t("product.estimateZone")}{" "}
            <span className="font-semibold text-gray-900">
              {deliveryEstimate.city
                ? `${deliveryEstimate.city}, ${deliveryEstimate.department}`
                : deliveryEstimate.department}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            {t("product.estimateRange")}{" "}
            <span className="font-semibold text-gray-900">
              {deliveryEstimate.range}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          {t("product.estimateUnavailable")}
        </p>
      )}
    </div>
  );
}
