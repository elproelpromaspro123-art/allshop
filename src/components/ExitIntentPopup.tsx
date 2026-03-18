"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHATSAPP_PHONE } from "@/lib/site";
import { useLanguage } from "@/providers/LanguageProvider";

export function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();
  const waUrl = useMemo(() => {
    const message = encodeURIComponent(t("exitIntent.message"));
    return `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
  }, [t]);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (dismissed) return;
      if (e.clientY <= 5 && e.relatedTarget === null) {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
          return;
        }
        setShow(true);
      }
    },
    [dismissed]
  );

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    try {
      if (sessionStorage.getItem("vortixy_exit_dismissed")) return;
    } catch {
      // ignore
    }

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

  const openAssistant = useCallback(() => {
    dismiss();
    window.dispatchEvent(new CustomEvent("vortixy:assistant-open"));
  }, [dismiss]);

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
      aria-label={t("exitIntent.ariaLabel")}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      
      <div className="surface-panel-dark surface-ambient brand-v-slash relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 text-white shadow-[var(--shadow-float-strong)] animate-[fade-in-up_300ms_ease-out]">
        <div className="relative z-[1] flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/78">
              Ayuda inmediata
            </p>
            <p className="mt-1 text-sm text-white/60">
              Soporte rapido antes de salir
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label={t("common.close")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/72 transition-all hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-6 text-center">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#25D366]/25 bg-[#25D366]/15 shadow-lg shadow-[#25D366]/10">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
          </div>
          
          <h3 className="mb-2 text-xl font-bold text-white">
            {t("exitIntent.title")}
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-white/68">
            {t("exitIntent.subtitle")}
          </p>
          
          <button
            onClick={openAssistant}
            className={cn(
              "flex items-center justify-center gap-2.5 w-full",
              "h-12 rounded-2xl",
              "bg-gradient-to-r from-[#25D366] to-emerald-500 text-white text-sm font-semibold",
              "shadow-[var(--shadow-whatsapp-soft)]",
              "hover:from-[#20BD5A] hover:to-emerald-600 active:scale-[0.98] transition-all duration-300"
            )}
          >
            <MessageCircle className="w-5 h-5" />
            {t("assistant.open")}
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-medium text-white/58 transition-colors hover:text-white/80"
          >
            <MessageCircle className="h-4 w-4" />
            {t("assistant.handoffButton")}
          </a>
          
          <button
            onClick={dismiss}
            className="mt-4 text-xs text-white/45 transition-colors hover:text-white/70"
          >
            {t("exitIntent.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
