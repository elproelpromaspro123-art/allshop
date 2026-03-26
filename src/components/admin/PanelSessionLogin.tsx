"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { AdminAccessShell } from "@/components/admin/shell/AdminAccessShell";
import { Button } from "@/components/ui/Button";
import { fetchWithCsrf } from "@/lib/csrf-client";
import type { ApiResponse } from "@/types/api";

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
      const response = await fetchWithCsrf("/api/internal/panel/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ token: token.trim() }),
      });

      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error || "No se pudo validar el acceso privado.",
        );
      }

      window.location.replace("/panel-privado");
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
    <AdminAccessShell
      eyebrow="Acceso privado"
      title="Acceso privado del panel"
      description="Primero valida la clave privada del panel. Despues podras ingresar al codigo operativo para gestionar catalogo y pedidos."
      currentStep={1}
      currentStepLabel="Paso 1 de 3"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/" className="gap-2">
            Volver a tienda
          </Link>
        </Button>
      }
      footer={
        <div className="panel-toolbar justify-between px-1 text-xs text-gray-500">
          <p>La clave privada no se guarda en el navegador.</p>
          <span className="panel-chip">Sesion segura</span>
        </div>
      }
    >
      <div className="grid gap-5 rounded-[1.5rem] border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-900">
              Clave privada del panel
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_12px_28px_rgba(10,15,30,0.05)] transition-colors focus-within:border-emerald-700/35">
              <KeyRound className="h-4.5 w-4.5 shrink-0 text-gray-300" />
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-300"
                placeholder="Ingresa la clave privada"
                autoComplete="current-password"
              />
            </div>
          </label>

          <Button
            type="submit"
            className="w-full"
            disabled={!token.trim() || isLoading}
            loading={isLoading}
            loadingText="Validando acceso..."
          >
            Continuar al panel
          </Button>
        </form>

        <p className="text-sm leading-relaxed text-gray-500">
          Una vez validado, la sesion se firma de forma segura y te lleva al
          control de catalogo y pedidos sin exponer la clave en la URL.
        </p>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">{error}</p>
            <p className="mt-1 text-sm text-red-700/80">
              Revisa la clave y vuelve a intentar.
            </p>
          </div>
        ) : null}
      </div>
    </AdminAccessShell>
  );
}
