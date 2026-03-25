"use client";

import { RotateCcw, ShieldAlert } from "lucide-react";

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
        <title>Error crítico | Vortixy</title>
      </head>
      <body className="antialiased font-sans">
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 text-gray-900">
          <div className="max-w-md w-full rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 text-center shadow-xl shadow-black/[0.04] animate-fade-in-up">
            {/* Critical Error Icon with Premium Styling */}
            <div className="relative mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 shadow-lg">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/10 to-rose-400/10 animate-pulse" />
              <ShieldAlert className="w-8 h-8 text-red-600 relative z-10" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-3 text-gray-900">
              Error crítico del servidor
            </h1>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              La plataforma no pudo cargar correctamente. Recarga la
              aplicación y, si el problema persiste, contacta a soporte con la
              referencia mostrada abajo.
            </p>

            <button
              onClick={() => reset()}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all shadow-lg shadow-emerald-500/25"
            >
              <RotateCcw className="w-5 h-5" />
              Recargar la aplicación
            </button>

            {error.digest && (
              <div className="mt-5 p-3 rounded-xl bg-gray-100 border border-gray-100">
                <p className="text-[10px] text-gray-300 font-mono break-all">
                  <span className="font-semibold text-gray-700">
                    Referencia:
                  </span>{" "}
                  {error.digest}
                </p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
