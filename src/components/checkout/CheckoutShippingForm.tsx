"use client";

import { Clock3, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { COLOMBIA_DEPARTMENTS } from "@/lib/delivery";
import { Input } from "@/components/ui/Input";

interface DeliveryEstimate {
  department: string;
  city: string | null;
  carrier: {
    code: string;
    name: string;
    insured: boolean;
  };
  availableCarriers: Array<{
    code: string;
    name: string;
    insured: boolean;
  }>;
  minBusinessDays: number;
  maxBusinessDays: number;
  formattedRange: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  confidence?: "high" | "medium";
  cutOffApplied: boolean;
}

interface CheckoutShippingFormProps {
  formData: {
    address: string;
    reference: string;
    city: string;
    department: string;
    zip: string;
  };
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onBlur?: (
    event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  fieldErrors?: Record<string, string>;
  touchedFields?: Set<string>;
  isLoadingEstimate: boolean;
  deliveryEstimate: DeliveryEstimate | null;
}

export function CheckoutShippingForm({
  formData,
  onChange,
  onBlur,
  fieldErrors = {},
  touchedFields = new Set(),
  isLoadingEstimate,
  deliveryEstimate,
}: CheckoutShippingFormProps) {
  const { t } = useLanguage();

  const hasError = (field: string) =>
    touchedFields.has(field) && !!fieldErrors[field];
  const errorMsg = (field: string) =>
    touchedFields.has(field) ? fieldErrors[field] : undefined;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
      <h2 className="mb-5 flex items-center gap-3 text-base font-bold text-gray-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MapPin className="h-4 w-4" />
        </div>
        {t("checkout.shippingAddress")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("checkout.addressPlaceholder")}
            label={`${t("checkout.address")} *`}
            error={hasError("address") ? errorMsg("address") : undefined}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("checkout.referencePlaceholder")}
            label={t("checkout.referenceLabel")}
            error={hasError("reference") ? errorMsg("reference") : undefined}
          />
        </div>
        <div>
          <Input
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("checkout.cityPlaceholder")}
            label={`${t("checkout.city")} *`}
            error={hasError("city") ? errorMsg("city") : undefined}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("checkout.department")} *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={onChange}
            onBlur={onBlur}
            aria-label={t("checkout.department")}
            className={cn(
              "h-12 w-full rounded-2xl border px-4 text-sm transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-4 hover:border-emerald-500/20",
              "appearance-none",
              hasError("department")
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-400/20"
                : "border-gray-200 bg-gray-50/70 focus:border-emerald-600 focus:ring-emerald-500/12",
            )}
          >
            <option value="">{t("checkout.select")}</option>
            {COLOMBIA_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          {errorMsg("department") && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5 animate-fade-in-up">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
              {errorMsg("department")}
            </p>
          )}
        </div>
        <div>
          <Input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={onChange}
            placeholder={t("checkout.zipPlaceholder")}
            label={t("checkout.zipCode")}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-6 min-h-[5rem] rounded-xl border px-4 py-4 text-sm transition-all duration-300",
          deliveryEstimate && !isLoadingEstimate
            ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
            : "border-gray-200 bg-gray-50 text-gray-400",
        )}
      >
        {isLoadingEstimate ? (
          <p className="flex items-center gap-1.5">
            <Clock3 className="w-4 h-4 text-emerald-600 animate-pulse" />
            {t("checkout.estimateLoading")}
          </p>
        ) : deliveryEstimate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-700" />
              <span className="text-emerald-900/72">{t("checkout.estimateLabel")}</span>
              <span className="font-semibold text-emerald-950">
                {deliveryEstimate.minBusinessDays} {t("checkout.estimateTo")}{" "}
                {deliveryEstimate.maxBusinessDays}{" "}
                {t("checkout.estimateBusinessDays")}
              </span>
            </p>
            <p className="pl-[1.4rem] text-xs text-emerald-900/68">
              {t("checkout.estimateWindow")}{" "}
              <span className="font-semibold text-emerald-950">
                {deliveryEstimate.formattedRange}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-gray-400">
            {t("checkout.estimateUnavailable")}
          </p>
        )}
      </div>
    </div>
  );
}
