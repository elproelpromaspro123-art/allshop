"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PHONE = "573142377202";
const MESSAGE = encodeURIComponent(
  "Hola Johan, estaba viendo productos en Vortixy y tengo una duda"
);
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (dismissed) return;
      if (e.clientY <= 5 && e.relatedTarget === null) {
        setShow(true);
      }
    },
    [dismissed]
  );

  useEffect(() => {
    // Only on desktop (pointer-based devices)
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    // Don't show if already dismissed this session
    try {
      if (sessionStorage.getItem("vortixy_exit_dismissed")) return;
    } catch {
      // ignore
    }

    // Delay enabling to avoid false triggers on initial load
    const timer = setTimeout(() => {
      document.addEventListener("mouseout", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const dismiss = useCallback(() => {
    setShow(false);
    setDismissed(true);
    try {
      sessionStorage.setItem("vortixy_exit_dismissed", "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="¿Te vas sin comprar?"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div
        className={cn(
          "relative w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-elevated)] overflow-hidden",
          "animate-[fade-in-up_300ms_ease-out]"
        )}
      >
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute top-3 right-3 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors z-10"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>

        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-[#25D366]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            ¿Tienes alguna duda?
          </h3>
          <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
            Si necesitas ayuda con un producto o tienes preguntas sobre tu pedido, escríbenos por WhatsApp. ¡Respondemos en minutos!
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className={cn(
              "flex items-center justify-center gap-2.5 w-full",
              "h-12 rounded-2xl",
              "bg-[#25D366] text-white text-sm font-semibold",
              "shadow-[0_2px_12px_-3px_rgba(37,211,102,0.4)]",
              "hover:bg-[#20BD5A] active:scale-[0.97] transition-all duration-300"
            )}
          >
            <MessageCircle className="w-5 h-5" />
            Chatear por WhatsApp
          </a>
          <button
            onClick={dismiss}
            className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
}
