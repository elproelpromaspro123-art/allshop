"use client";

import { Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { COLOMBIA_DEPARTMENTS } from "@/lib/delivery";

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
    <motion.div
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        "bg-white border-[var(--border)]"
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <h2
        className={cn(
          "text-base font-bold mb-4",
          "text-[var(--foreground)]"
        )}
      >
        {t("checkout.shippingAddress")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
            {t("checkout.address")} *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("checkout.addressPlaceholder")}
            className={cn(inputCls(), hasError("address") && "border-red-400 focus:ring-red-400")}
          />
          {errorMsg("address") && <p className="mt-1 text-xs text-red-500">{errorMsg("address")}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
            Referencia de direccion (barrio, apartamento o punto clave) *
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ejemplo: Barrio Cedritos, Torre 2 apto 503, portería blanca"
            className={cn(inputCls(), hasError("reference") && "border-red-400 focus:ring-red-400")}
          />
          {errorMsg("reference") && <p className="mt-1 text-xs text-red-500">{errorMsg("reference")}</p>}
        </div>
        <div>
          <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
            {t("checkout.city")} *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("checkout.cityPlaceholder")}
            className={cn(inputCls(), hasError("city") && "border-red-400 focus:ring-red-400")}
          />
          {errorMsg("city") && <p className="mt-1 text-xs text-red-500">{errorMsg("city")}</p>}
        </div>
        <div>
          <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
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
          <label className={cn("block text-sm font-medium mb-1.5", "text-neutral-700")}>
            {t("checkout.zipCode")}
          </label>
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={onChange}
            placeholder={t("checkout.zipPlaceholder")}
            className={inputCls()}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 rounded-xl border p-3 text-sm",
          "border-[var(--border)] bg-[var(--surface-muted)] text-neutral-600"
        )}
      >
        {isLoadingEstimate ? (
          <p className="flex items-center gap-1.5 text-neutral-500">
            <Clock3 className="w-4 h-4 text-[var(--accent-strong)]" />
            Calculando entrega estimada...
          </p>
        ) : deliveryEstimate ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Clock3 className="w-4 h-4 text-[var(--accent-strong)]" />
              <span className="text-neutral-500">Entrega estimada:</span>
              <span className="font-semibold text-[var(--accent-strong)]">
                {deliveryEstimate.minBusinessDays} a {deliveryEstimate.maxBusinessDays} dias habiles
              </span>
            </p>
            <p className="text-xs text-neutral-500">
              Ventana estimada:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {deliveryEstimate.formattedRange}
              </span>
            </p>
            <p className="text-xs text-neutral-500">
              Transportadora sugerida:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {deliveryEstimate.carrier.name}
              </span>{" "}
              ({deliveryEstimate.carrier.insured ? "asegurada" : "estandar"})
            </p>
          </div>
        ) : (
          <p className="text-neutral-500">No disponible por ahora</p>
        )}
      </div>
    </motion.div>
  );
}
