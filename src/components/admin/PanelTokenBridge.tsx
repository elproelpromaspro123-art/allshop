"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";

interface Props {
  token: string;
}

export function PanelTokenBridge({ token }: Props) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const syncSession = async () => {
      try {
        const response = await fetch("/api/internal/panel/session", {
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
      }
    };

    void syncSession();

    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <section className="mx-auto max-w-xl px-4 py-14">
      <div className="surface-panel px-6 py-6 text-center sm:px-7 sm:py-7">
        <div className="relative z-[1]">
          <p className="section-badge mb-4">Acceso protegido</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Validando la sesion privada
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Estamos trasladando el acceso a una sesion segura para evitar que el
            panel dependa del token en la URL.
          </p>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <p className="mt-4 text-sm font-medium text-[var(--muted-strong)]">
              Preparando el panel...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
