"use client";

import { useEffect, useState } from "react";
import { X, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_COOKIE_CONSENT,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [consent, setConsentState] = useState<CookieConsent>(
    DEFAULT_COOKIE_CONSENT,
  );

  useEffect(() => {
    const existing = readCookieConsent();
    if (!existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial visibility state from localStorage is intentional
      setVisible(true);
    } else {
      setConsentState(existing);
    }
  }, []);

  function acceptAll() {
    const newConsent: CookieConsent = {
      analytics: true,
      marketing: true,
      acceptedAt: new Date().toISOString(),
    };
    setConsentState(newConsent);
    writeCookieConsent(newConsent);
    setVisible(false);
  }

  function acceptMinimal() {
    const newConsent: CookieConsent = {
      analytics: false,
      marketing: false,
      acceptedAt: new Date().toISOString(),
    };
    setConsentState(newConsent);
    writeCookieConsent(newConsent);
    setVisible(false);
  }

  function saveAndClose() {
    const newConsent: CookieConsent = {
      ...consent,
      acceptedAt: new Date().toISOString(),
    };
    setConsentState(newConsent);
    writeCookieConsent(newConsent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Configuración de cookies"
    >
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 shrink-0">
            <Cookie className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Uso de cookies
            </h2>
            <p className="text-sm text-gray-500">
              Utilizamos cookies para mejorar tu experiencia. Puedes aceptar
              todas, solo las necesarias o personalizar tus preferencias.
            </p>
          </div>
          <button
            onClick={acceptMinimal}
            aria-label="Cerrar"
            className="p-1 rounded-full hover:bg-gray-400/50 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-400/20">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Cookies necesarias
              </h3>
              <p className="text-xs text-gray-500">
                Siempre activas. Incluyen carrito, checkout y seguridad.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-500 shrink-0">
              Siempre activas
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-400/20">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Analytics
              </h3>
              <p className="text-xs text-gray-500">
                Nos ayudan a entender cómo usas el sitio para mejorarlo.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={consent.analytics}
              onClick={() =>
                setConsentState((prev) => ({ ...prev, analytics: !prev.analytics }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/12",
                consent.analytics
                  ? "bg-emerald-500"
                  : "bg-gray-400",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                  consent.analytics ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-400/20">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Marketing
              </h3>
              <p className="text-xs text-gray-500">
                Usadas para mostrar anuncios relevantes en otras plataformas.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={consent.marketing}
              onClick={() =>
                setConsentState((prev) => ({ ...prev, marketing: !prev.marketing }))
              }
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/12",
                consent.marketing
                  ? "bg-emerald-500"
                  : "bg-gray-400",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                  consent.marketing ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={acceptMinimal}>
            Solo necesarias
          </Button>
          <Button variant="outline" size="sm" onClick={saveAndClose}>
            Guardar preferencias
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
