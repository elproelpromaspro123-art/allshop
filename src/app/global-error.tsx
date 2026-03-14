"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-CO">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error critico | Vortixy</title>
      </head>
      <body className="antialiased font-sans">
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)] text-[var(--foreground)]">
          <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-10 text-center shadow-lg">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3 text-[var(--foreground)]">
              Error critico del servidor
            </h1>
            <p className="text-sm text-[var(--muted)] mb-8 leading-relaxed">
              La plataforma no pudo cargar correctamente debido a una eventualidad tecnica profunda. Por favor recarga el navegador.
              Si el error persiste, contacta al soporte.
            </p>
            <button
              onClick={() => reset()}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Recargar la aplicacion
            </button>
            <p className="mt-5 text-[10px] text-[var(--muted-faint)] font-mono break-all">
              {error.digest ? `DIGEST: ${error.digest}` : "Error desconocido"}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

