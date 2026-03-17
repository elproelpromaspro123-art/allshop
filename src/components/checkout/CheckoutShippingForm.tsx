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
    <div className="rounded-[var(--section-radius)] border p-5 sm:p-7 bg-white border-[var(--border)] shadow-[var(--shadow-soft)]">
      <h2
        className="text-base font-bold mb-5 text-[var(--foreground)] flex items-center gap-2"
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
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted-strong)]">
            {t("checkout.department")} *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={onChange}
            onBlur={onBlur}
            className={cn(
              "w-full h-12 px-4 rounded-xl border-2 text-sm transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-4 focus:ring-opacity-20 hover:border-[var(--border-subtle)]",
              "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m2%204%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat",
              hasError("department")
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-400/20"
                : "border-[var(--border)] bg-white focus:border-[var(--accent-strong)] focus:ring-[var(--accent-ring)]"
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

      <div className={cn(
        "mt-5 rounded-[var(--card-radius)] border-2 p-4 text-sm min-h-[4.5rem] transition-all duration-300",
        deliveryEstimate && !isLoadingEstimate
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-[var(--border)] bg-[var(--surface-muted)]"
      )}>
        {isLoadingEstimate ? (
          <p className="flex items-center gap-1.5 text-[var(--muted-soft)]">
            <Clock3 className="w-4 h-4 text-[var(--accent-strong)] animate-pulse" />
            {t("checkout.estimateLoading")}
          </p>
        ) : deliveryEstimate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span className="text-[var(--muted-soft)]">{t("checkout.estimateLabel")}</span>
              <span className="font-semibold text-emerald-700">
                {deliveryEstimate.minBusinessDays} {t("checkout.estimateTo")} {deliveryEstimate.maxBusinessDays} {t("checkout.estimateBusinessDays")}
              </span>
            </p>
            <p className="text-xs text-[var(--muted-soft)] pl-5.5">
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

