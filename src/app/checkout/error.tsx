"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Checkout error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full surface-panel px-8 py-10 text-center">
        <div className="relative z-[1]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-200/60">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Error en el checkout
          </h2>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            Ocurrió un problema al procesar tu pedido. Tu carrito no se ha modificado.
            Intenta de nuevo o contáctanos si el error persiste.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={reset} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
