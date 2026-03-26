"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { AdminAccessShell } from "@/components/admin/shell/AdminAccessShell";
import { Button } from "@/components/ui/Button";
import { fetchWithCsrf } from "@/lib/csrf-client";
import type { ApiResponse } from "@/types/api";

interface Props {
  token: string;
}

export function PanelTokenBridge({ token }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const syncSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchWithCsrf("/api/internal/panel/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({ token }),
        });

        const payload = (await response.json()) as ApiResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.error || "No se pudo validar el acceso privado.",
          );
        }

        window.location.replace("/panel-privado");
      } catch (bridgeError) {
        if (ignore) return;
        setError(
          bridgeError instanceof Error
            ? bridgeError.message
          : "No se pudo validar el acceso privado.",
        );
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void syncSession();

    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <AdminAccessShell
      eyebrow="Acceso protegido"
      title="Validando la sesion privada"
      description="Estamos trasladando el acceso a una sesion segura para evitar que el panel dependa del token en la URL."
      currentStep={2}
      currentStepLabel="Paso 2 de 3"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            Volver a tienda
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
      footer={
        <div className="panel-toolbar justify-between px-1 text-xs text-gray-500">
          <p>La sesion privada se firma y expira en el navegador.</p>
          <span className="panel-chip">Acceso temporal</span>
        </div>
      }
    >
      <div className="grid gap-5 rounded-[1.5rem] border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sesion en curso
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            Token validado
          </span>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">{error}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => window.location.reload()} loading={isLoading}>
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
              <Button asChild variant="outline">
                <Link href="/panel-privado">Ir al panel</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? "Preparando el panel..." : "Sesion lista, redirigiendo al panel."}
            </p>
            <p className="text-sm leading-relaxed text-gray-500">
              La validacion se realiza en segundo plano para dejar el token fuera
              de la URL y convertirlo en una sesion segura.
            </p>
          </div>
        )}
      </div>
    </AdminAccessShell>
  );
}
