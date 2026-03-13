"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry
    console.error("Runtime Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-10 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-3">
          ¡Ups! Algo ha salido mal
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8 leading-relaxed">
          Ha ocurrido un error inesperado cargando esta sección de la tienda. Nuestro equipo ha sido notificado. Si el problema persiste, vuelve al inicio.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full gap-2 font-bold bg-[#071a0a] text-white hover:bg-[#071a0a]/90">
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full gap-2 font-bold">
              <Home className="w-4 h-4 text-neutral-500" />
              Volver a la tienda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
