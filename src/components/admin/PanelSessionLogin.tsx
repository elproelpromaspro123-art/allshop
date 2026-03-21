"use client";

import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCsrfToken } from "@/lib/csrf-client";

export function PanelSessionLogin() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch("/api/internal/panel/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        cache: "no-store",
        body: JSON.stringify({ token: token.trim() }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          payload.error || "No se pudo validar el acceso privado.",
        );
      }

      window.location.reload();
    } catch (sessionError) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "No se pudo validar el acceso privado.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-14">
      <div className="surface-panel px-6 py-6 sm:px-7 sm:py-7">
        <div className="relative z-[1]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Acceso privado del panel
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Primero valida la clave privada del panel. Despues podras ingresar
            el codigo operativo para gestionar catalogo y pedidos.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                Clave privada del panel
              </span>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(10,15,30,0.05)] transition-colors focus-within:border-[var(--accent-strong)]/35">
                <KeyRound className="h-4.5 w-4.5 shrink-0 text-[var(--muted-faint)]" />
                <input
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-faint)]"
                  placeholder="Ingresa la clave privada"
                  autoComplete="current-password"
                />
              </div>
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={!token.trim() || isLoading}
            >
              {isLoading ? "Validando acceso..." : "Continuar al panel"}
            </Button>
          </form>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
