"use client";

import { Clock3 } from "lucide-react";
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

const inputCls = () =>
  cn(
    "w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow",
    "border-[var(--border)] bg-white"
  );

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
    <div className="rounded-[var(--card-radius)] border p-5 sm:p-6 bg-white border-[var(--border)]">
      <h2
        className="text-base font-bold mb-4 text-[var(--foreground)]"
      >
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
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted-strong)]">
            {t("checkout.department")} *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={onChange}
            onBlur={onBlur}
            className={cn(inputCls(), hasError("department") && "border-red-400 focus:ring-red-400")}
          >
            <option value="">{t("checkout.select")}</option>
            {COLOMBIA_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          {errorMsg("department") && <p className="mt-1 text-xs text-red-500">{errorMsg("department")}</p>}
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

      <div className="mt-4 rounded-xl border p-3 text-sm min-h-[4.5rem] border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]">
        {isLoadingEstimate ? (
          <p className="flex items-center gap-1.5 text-[var(--muted-soft)]">
            <Clock3 className="w-4 h-4 text-[var(--accent-strong)]" />
            {t("checkout.estimateLoading")}
          </p>
        ) : deliveryEstimate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Clock3 className="w-4 h-4 text-[var(--accent-strong)]" />
              <span className="text-[var(--muted-soft)]">{t("checkout.estimateLabel")}</span>
              <span className="font-semibold text-[var(--accent-strong)]">
                {deliveryEstimate.minBusinessDays} {t("checkout.estimateTo")} {deliveryEstimate.maxBusinessDays} {t("checkout.estimateBusinessDays")}
              </span>
            </p>
            <p className="text-xs text-[var(--muted-soft)]">
              {t("checkout.estimateWindow")}{" "}
              <span className="font-semibold text-[var(--foreground)]">
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

