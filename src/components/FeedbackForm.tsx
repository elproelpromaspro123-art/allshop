"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

const TYPE_OPTIONS: Array<{ value: FeedbackType; label: string }> = [
  { value: "comentario", label: "Comentario" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "error", label: "Reporte de error" },
];

export function FeedbackForm() {
  const [form, setForm] = useState<FeedbackFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setForm((prev) => ({
      ...prev,
      page: `${window.location.pathname}${window.location.search}`,
    }));
  }, []);

  const isGmail = form.email.trim().toLowerCase().endsWith("@gmail.com");

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length >= 2 &&
      form.email.trim().toLowerCase().endsWith("@gmail.com") &&
      form.message.trim().length >= 10 &&
      !isSubmitting
    );
  }, [form, isSubmitting]);

  const inputClass = cn(
    "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-strong)]",
    "border-[var(--border)] bg-white text-neutral-900 placeholder:text-neutral-400"
  );

  function onChange<K extends keyof FeedbackFormState>(key: K, value: FeedbackFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    if (!isGmail) {
      setErrorMessage("El correo debe ser una cuenta de Gmail valida (@gmail.com).");
      return;
    }

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
        setErrorMessage(data.error || "No se pudo enviar el feedback.");
        return;
      }

      setSuccessMessage("Gracias. Recibimos tu feedback y lo revisaremos pronto.");
      setForm((prev) => ({
        ...INITIAL_FORM,
        page: prev.page,
      }));
    } catch {
      setErrorMessage("Error de conexion. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
            Tipo
          </label>
          <select
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
            Pedido (opcional)
          </label>
          <input
            value={form.orderId}
            onChange={(event) => onChange("orderId", event.target.value)}
            className={inputClass}
            placeholder="ID o referencia"
            maxLength={80}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
            Nombre
          </label>
          <input
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            className={inputClass}
            placeholder="Tu nombre"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
            Correo Gmail
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange("email", event.target.value)}
            className={inputClass}
            placeholder="tunombre@gmail.com"
            maxLength={120}
            pattern="^[^\\s@]+@gmail\\.com$"
            required
          />
          <p className="mt-1 text-xs text-neutral-500">
            Solo aceptamos correos Gmail para responder tu feedback.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
          Mensaje
        </label>
        <textarea
          value={form.message}
          onChange={(event) => onChange("message", event.target.value)}
          className={cn(inputClass, "min-h-[120px] resize-y")}
          placeholder="Describe el problema o sugerencia con detalle."
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
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar feedback
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
