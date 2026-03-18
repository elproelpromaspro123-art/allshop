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
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
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

  const hasError = (field: string) => touchedFields.has(field) && !!fieldErrors[field];
  const errorMsg = (field: string) => touchedFields.has(field) ? fieldErrors[field] : undefined;

  return (
    <div className="surface-panel px-5 py-6 sm:px-7 sm:py-7">
      <h2
        className="mb-5 flex items-center gap-2 text-base font-bold text-[var(--foreground)]"
      >
        <MapPin className="w-4 h-4 text-[var(--accent-strong)]" />
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
          <label className="mb-2 block text-sm font-medium text-[var(--muted-strong)]">
            {t("checkout.department")} *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={onChange}
            onBlur={onBlur}
            className={cn(
              "h-12 w-full rounded-2xl border px-4 text-sm transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-4 hover:border-[var(--accent)]/20",
              "appearance-none",
              hasError("department")
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-400/20"
                : "border-[var(--border-subtle)] bg-[var(--surface-muted)]/70 focus:border-[var(--accent-strong)] focus:ring-[var(--accent-ring)]"
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
          "mt-6 min-h-[5rem] p-4 text-sm transition-all duration-300",
          deliveryEstimate && !isLoadingEstimate
            ? "surface-panel-dark surface-ambient brand-v-slash text-white"
            : "surface-panel text-[var(--muted-soft)]"
        )}
      >
        {isLoadingEstimate ? (
          <p className="flex items-center gap-1.5">
            <Clock3 className="w-4 h-4 text-[var(--accent-strong)] animate-pulse" />
            {t("checkout.estimateLoading")}
          </p>
        ) : deliveryEstimate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-300" />
              <span className="text-white/70">{t("checkout.estimateLabel")}</span>
              <span className="font-semibold text-white">
                {deliveryEstimate.minBusinessDays} {t("checkout.estimateTo")} {deliveryEstimate.maxBusinessDays} {t("checkout.estimateBusinessDays")}
              </span>
            </p>
            <p className="pl-[1.4rem] text-xs text-white/68">
              {t("checkout.estimateWindow")}{" "}
              <span className="font-semibold text-white">
                {deliveryEstimate.formattedRange}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-[var(--muted-soft)]">{t("checkout.estimateUnavailable")}</p>
        )}
      </div>
    </div>
  );
}

