"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

type FeedbackType = "error" | "sugerencia" | "comentario";

interface FeedbackFormState {
  type: FeedbackType;
  name: string;
  email: string;
  orderId: string;
  page: string;
  message: string;
}

const INITIAL_FORM: FeedbackFormState = {
  type: "comentario",
  name: "",
  email: "",
  orderId: "",
  page: "",
  message: "",
};

export function FeedbackForm() {
  const [form, setForm] = useState<FeedbackFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { t } = useLanguage();

  const TYPE_OPTIONS: Array<{ value: FeedbackType; label: string }> = [
    { value: "comentario", label: t("feedbackForm.type.comment") },
    { value: "sugerencia", label: t("feedbackForm.type.suggestion") },
    { value: "error", label: t("feedbackForm.type.error") },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    setForm((prev) => ({
      ...prev,
      page: `${window.location.pathname}${window.location.search}`,
    }));
  }, []);

  const canSubmit = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      form.name.trim().length >= 2 &&
      emailRegex.test(form.email.trim()) &&
      form.message.trim().length >= 10 &&
      !isSubmitting
    );
  }, [form, isSubmitting]);

  const inputClass = cn(
    "w-full rounded-2xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:border-transparent",
    "border-[var(--border-subtle)] bg-[var(--surface-muted)]/70 text-[var(--foreground)] placeholder:text-[var(--muted-faint)]",
    "focus:ring-[var(--accent-ring)] hover:border-[var(--accent)]/20 hover:bg-white",
  );

  function onChange<K extends keyof FeedbackFormState>(
    key: K,
    value: FeedbackFormState[K],
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
      const response = await fetchWithCsrf("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrorMessage(data.error || t("feedbackForm.errorGeneric"));
        return;
      }

      setSuccessMessage(t("feedbackForm.success"));
      setForm((prev) => ({
        ...INITIAL_FORM,
        page: prev.page,
      }));
    } catch (error) {
      setErrorMessage(
        isCsrfClientError(error)
          ? "Error de seguridad. Recarga la página e intenta nuevamente."
          : t("feedbackForm.errorConnection"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {/* Type and Order ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="feedback-type"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("feedbackForm.typeLabel")}
          </label>
          <select
            id="feedback-type"
            value={form.type}
            onChange={(event) =>
              onChange("type", event.target.value as FeedbackType)
            }
            className={cn(inputClass, "appearance-none pr-9 cursor-pointer")}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="feedback-order"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("feedbackForm.orderLabel")}
          </label>
          <input
            id="feedback-order"
            value={form.orderId}
            onChange={(event) => onChange("orderId", event.target.value)}
            className={inputClass}
            placeholder={t("feedbackForm.orderPlaceholder")}
            maxLength={80}
          />
        </div>
      </div>

      {/* Name and Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="feedback-name"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("feedbackForm.nameLabel")}
          </label>
          <input
            id="feedback-name"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            className={inputClass}
            placeholder={t("feedbackForm.namePlaceholder")}
            maxLength={80}
            required
          />
        </div>
        <div>
          <label
            htmlFor="feedback-email"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
          >
            {t("feedbackForm.emailLabel")}
          </label>
          <input
            id="feedback-email"
            type="email"
            value={form.email}
            onChange={(event) => onChange("email", event.target.value)}
            className={inputClass}
            placeholder={t("feedbackForm.emailPlaceholder")}
            maxLength={120}
            required
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted-soft)]">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--secondary)]" />
            {t("feedbackForm.emailHint")}
          </p>
        </div>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="feedback-message"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/58"
        >
          {t("feedbackForm.messageLabel")}
        </label>
        <textarea
          id="feedback-message"
          value={form.message}
          onChange={(event) => onChange("message", event.target.value)}
          className={cn(inputClass, "min-h-[144px] resize-y")}
          placeholder={t("feedbackForm.messagePlaceholder")}
          maxLength={2000}
          required
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-[var(--muted-faint)]">
            {t("feedbackForm.messageMinHint") !== "feedbackForm.messageMinHint"
              ? t("feedbackForm.messageMinHint")
              : "Mínimo 10 caracteres"}
          </p>
          <p
            className={cn(
              "text-[10px] font-mono",
              form.message.length > 1800
                ? "text-amber-600"
                : "text-[var(--muted-faint)]",
            )}
          >
            {form.message.length}/2000
          </p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-1">
        <Button
          type="submit"
          size="sm"
          className="gap-2 rounded-2xl bg-[var(--gradient-primary)] px-5 shadow-[var(--shadow-action)] hover:brightness-105"
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("feedbackForm.sending")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("feedbackForm.submit")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
