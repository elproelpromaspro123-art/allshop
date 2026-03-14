"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-strong)]",
    "border-[var(--border)] bg-white text-[var(--foreground)] placeholder:text-[var(--muted-faint)]"
  );

  function onChange<K extends keyof FeedbackFormState>(key: K, value: FeedbackFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/feedback", {
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
    } catch {
      setErrorMessage(t("feedbackForm.errorConnection"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="feedback-type" className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
            {t("feedbackForm.typeLabel")}
          </label>
          <select
            id="feedback-type"
            value={form.type}
            onChange={(event) => onChange("type", event.target.value as FeedbackType)}
            className={inputClass}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="feedback-order" className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="feedback-name" className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
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
          <label htmlFor="feedback-email" className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
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
          <p className="mt-1 text-xs text-[var(--muted-soft)]">
            {t("feedbackForm.emailHint")}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="feedback-message" className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
          {t("feedbackForm.messageLabel")}
        </label>
        <textarea
          id="feedback-message"
          value={form.message}
          onChange={(event) => onChange("message", event.target.value)}
          className={cn(inputClass, "min-h-[120px] resize-y")}
          placeholder={t("feedbackForm.messagePlaceholder")}
          maxLength={2000}
          required
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="text-sm text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="pt-1">
        <Button type="submit" size="sm" className="gap-2" disabled={!canSubmit}>
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

