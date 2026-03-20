"use client";

import { useMemo, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

type RequestType = "access" | "update" | "delete" | "export";

interface HabeasDataFormState {
  name: string;
  email: string;
  phone: string;
  document: string;
  requestType: RequestType;
  details: string;
}

const INITIAL_FORM: HabeasDataFormState = {
  name: "",
  email: "",
  phone: "",
  document: "",
  requestType: "access",
  details: "",
};

export function HabeasDataForm() {
  const [form, setForm] = useState<HabeasDataFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { t } = useLanguage();

  const REQUEST_OPTIONS: Array<{ value: RequestType; label: string }> = [
    { value: "access", label: t("policy.privacy.habeasData.requestTypeAccess") },
    { value: "update", label: t("policy.privacy.habeasData.requestTypeUpdate") },
    { value: "delete", label: t("policy.privacy.habeasData.requestTypeDelete") },
    { value: "export", label: t("policy.privacy.habeasData.requestTypeExport") },
  ];

  const canSubmit = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      form.name.trim().length >= 2 &&
      emailRegex.test(form.email.trim()) &&
      form.document.trim().length >= 4 &&
      form.requestType.length > 0 &&
      !isSubmitting
    );
  }, [form, isSubmitting]);

  const inputClass = cn(
    "w-full rounded-2xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:border-transparent",
    "border-[var(--border-subtle)] bg-[var(--surface-muted)]/70 text-[var(--foreground)] placeholder:text-[var(--muted-faint)]",
    "focus:ring-[var(--accent-ring)] hover:border-[var(--accent)]/20 hover:bg-white",
  );

  function onChange<K extends keyof HabeasDataFormState>(
    key: K,
    value: HabeasDataFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/habeas-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrorMessage(data.error || t("policy.privacy.habeasData.error"));
        return;
      }

      setSuccessMessage(t("policy.privacy.habeasData.success"));
      setForm(INITIAL_FORM);
    } catch {
      setErrorMessage(t("policy.privacy.habeasData.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="habeas-name"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("policy.privacy.habeasData.nameLabel")}
          </label>
          <input
            id="habeas-name"
            type="text"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            className={inputClass}
            placeholder={t("policy.privacy.habeasData.namePlaceholder")}
            maxLength={80}
            autoComplete="name"
          />
        </div>
        <div>
          <label
            htmlFor="habeas-email"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("policy.privacy.habeasData.emailLabel")}
          </label>
          <input
            id="habeas-email"
            type="email"
            value={form.email}
            onChange={(event) => onChange("email", event.target.value)}
            className={inputClass}
            placeholder={t("policy.privacy.habeasData.emailPlaceholder")}
            maxLength={120}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="habeas-phone"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("policy.privacy.habeasData.phoneLabel")}
          </label>
          <input
            id="habeas-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            className={inputClass}
            placeholder={t("policy.privacy.habeasData.phonePlaceholder")}
            maxLength={20}
            autoComplete="tel"
          />
        </div>
        <div>
          <label
            htmlFor="habeas-document"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("policy.privacy.habeasData.documentLabel")}
          </label>
          <input
            id="habeas-document"
            type="text"
            value={form.document}
            onChange={(event) => onChange("document", event.target.value)}
            className={inputClass}
            placeholder={t("policy.privacy.habeasData.documentPlaceholder")}
            maxLength={20}
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="habeas-request-type"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
        >
          {t("policy.privacy.habeasData.requestTypeLabel")}
        </label>
        <select
          id="habeas-request-type"
          value={form.requestType}
          onChange={(event) => onChange("requestType", event.target.value as RequestType)}
          className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}
        >
          {REQUEST_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="habeas-details"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
        >
          {t("policy.privacy.habeasData.detailsLabel")}
        </label>
        <textarea
          id="habeas-details"
          value={form.details}
          onChange={(event) => onChange("details", event.target.value)}
          className={cn(inputClass, "min-h-[100px] resize-y")}
          placeholder={t("policy.privacy.habeasData.detailsPlaceholder")}
          maxLength={1000}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span role="alert">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span role="status">{successMessage}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Enviando...</span>
          </>
        ) : (
          t("policy.privacy.habeasData.submit")
        )}
      </Button>
    </form>
  );
}