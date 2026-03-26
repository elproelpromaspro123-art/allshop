"use client";

import { Clock3, MapPin, ShieldCheck, Truck } from "lucide-react";
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
  fieldSuccess?: Record<string, boolean>;
  isLoadingEstimate: boolean;
  deliveryEstimate: DeliveryEstimate | null;
  autoDetectedDepartment?: boolean;
}

export function CheckoutShippingForm({
  formData,
  onChange,
  onBlur,
  fieldErrors = {},
  touchedFields = new Set(),
  fieldSuccess = {},
  isLoadingEstimate,
  deliveryEstimate,
  autoDetectedDepartment = false,
}: CheckoutShippingFormProps) {
  const { t } = useLanguage();

  const hasError = (field: string) =>
    touchedFields.has(field) && !!fieldErrors[field];
  const errorMsg = (field: string) =>
    touchedFields.has(field) ? fieldErrors[field] : undefined;
  const hasSuccess = (field: string) =>
    Boolean(fieldSuccess[field]) && !hasError(field);

  const carrierCount = deliveryEstimate?.availableCarriers?.length ?? 0;
  const confidenceLabel =
    deliveryEstimate?.confidence === "high" ? "Alta confianza" : "Estimacion preliminar";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-base font-bold text-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <MapPin className="h-4 w-4" />
            </div>
            {t("checkout.shippingAddress")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Ajusta tu direccion final y confirma la ciudad exacta antes de cerrar el pedido.
          </p>
        </div>

        <div className="hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 sm:inline-flex">
          Colombia
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("checkout.addressPlaceholder")}
            label={`${t("checkout.address")} *`}
            autoComplete="street-address"
            error={hasError("address") ? errorMsg("address") : undefined}
            success={hasSuccess("address")}
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
            autoComplete="address-line2"
            error={hasError("reference") ? errorMsg("reference") : undefined}
            success={hasSuccess("reference")}
            hint="Incluye barrio, torre, apartamento o un punto facil de reconocer."
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
            autoComplete="address-level2"
            error={hasError("city") ? errorMsg("city") : undefined}
            success={hasSuccess("city")}
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
            autoComplete="address-level1"
            className={cn(
              "h-12 w-full appearance-none rounded-2xl border px-4 text-sm transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-4 hover:border-emerald-500/20",
              hasError("department")
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-400/20"
                : hasSuccess("department")
                  ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20"
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
          {autoDetectedDepartment && formData.department && !errorMsg("department") ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sugerimos este departamento segun tu zona actual. Puedes cambiarlo.
            </p>
          ) : null}
          {errorMsg("department") && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 animate-fade-in-up">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
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
            onBlur={onBlur}
            placeholder={t("checkout.zipPlaceholder")}
            label={t("checkout.zipCode")}
            autoComplete="postal-code"
            success={hasSuccess("zip")}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-6 rounded-[1.35rem] border px-4 py-4 text-sm transition-all duration-300",
          deliveryEstimate && !isLoadingEstimate
            ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
            : "border-gray-200 bg-gray-50 text-gray-500",
        )}
      >
        {isLoadingEstimate ? (
          <p className="flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 animate-pulse text-emerald-600" />
            {t("checkout.estimateLoading")}
          </p>
        ) : deliveryEstimate ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-950">
                <Truck className="h-4 w-4 text-emerald-700" />
                {t("checkout.estimateLabel")} {deliveryEstimate.minBusinessDays} {t("checkout.estimateTo")} {deliveryEstimate.maxBusinessDays} {t("checkout.estimateBusinessDays")}
              </p>
              <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                {confidenceLabel}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  Ventana
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">
                  {deliveryEstimate.formattedRange}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  Transportadora
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">
                  {deliveryEstimate.carrier.name}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  Destino
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">
                  {deliveryEstimate.city || formData.city || "Tu ciudad"},{" "}
                  {deliveryEstimate.department}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  Cobertura
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">
                  {carrierCount} transportadora{carrierCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  Señal
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">
                  {deliveryEstimate.cutOffApplied ? "Corte aplicado" : "Sin corte aplicado"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-white/70 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                  Seguridad
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-950">
                  {deliveryEstimate.carrier.insured ? "Con seguro" : "Cobertura basica"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-500">{t("checkout.estimateUnavailable")}</p>
            <p className="text-xs leading-5 text-gray-400">
              Si no logramos calcular la estimacion, puedes continuar y la validamos manualmente antes de confirmar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
