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
      aria-label={t("exitIntent.ariaLabel")}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-elevated)] overflow-hidden animate-[fade-in-up_300ms_ease-out]"
      >
        <button
          onClick={dismiss}
          aria-label={t("common.close")}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-[var(--surface-muted)] hover:bg-[var(--surface)] transition-colors z-10"
        >
          <X className="w-4 h-4 text-[var(--muted-soft)]" />
        </button>

        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-[#25D366]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            {t("exitIntent.title")}
          </h3>
          <p className="text-sm text-[var(--muted-soft)] mb-5 leading-relaxed">
            {t("exitIntent.subtitle")}
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className={cn(
              "flex items-center justify-center gap-2.5 w-full",
              "h-12 rounded-2xl",
              "bg-[#25D366] text-white text-sm font-semibold",
              "shadow-[var(--shadow-whatsapp-soft)]",
              "hover:bg-[#20BD5A] active:scale-[0.97] transition-all duration-300"
            )}
          >
            <MessageCircle className="w-5 h-5" />
            {t("exitIntent.cta")}
          </a>
          <button
            onClick={dismiss}
            className="mt-3 text-xs text-[var(--muted-faint)] hover:text-[var(--muted)] transition-colors"
          >
            {t("exitIntent.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}

