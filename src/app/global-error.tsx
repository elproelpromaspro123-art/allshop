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
        <title>Error crítico | Vortixy</title>
      </head>
      <body className="antialiased font-sans">
        <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 text-neutral-900">
          <div className="max-w-md w-full rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10 text-center shadow-lg">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3 text-neutral-900">
              Error crítico del servidor
            </h1>
            <p className="text-sm text-neutral-600 mb-8 leading-relaxed">
              La plataforma no pudo cargar correctamente debido a una eventualidad técnica profunda. Por favor recarga el navegador.
              Si el error persiste, contacta al soporte.
            </p>
            <button
              onClick={() => reset()}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Recargar la aplicación
            </button>
            <p className="mt-5 text-[10px] text-neutral-400 font-mono break-all">
              {error.digest ? `DIGEST: ${error.digest}` : "Error desconocido"}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
