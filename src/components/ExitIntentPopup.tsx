"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHATSAPP_PHONE } from "@/lib/site";
import { useLanguage } from "@/providers/LanguageProvider";
import { MarketingBadgePill } from "@/components/marketing/MarketingPrimitives";

export function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
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
    [dismissed],
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

  useEffect(() => {
    if (!show) return;

    const modal = popupRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);
    if (firstElement) {
      firstElement.focus();
    } else {
      modal.focus();
    }

    return () => document.removeEventListener("keydown", handleTabKey);
  }, [show]);

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-describedby="exit-intent-description"
      aria-label={t("exitIntent.ariaLabel")}
      tabIndex={-1}
    >
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={dismiss}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[1.85rem] border border-white/10 bg-slate-950 text-white shadow-[0_34px_100px_rgba(2,6,23,0.4)] animate-[fade-in-up_300ms_ease-out]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_35%)]" />

        <div className="relative z-[1] border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <MarketingBadgePill
                icon={Sparkles}
                label="Ayuda inmediata"
                sublabel="Antes de salir, resolvemos la duda"
                tone="emerald"
                className="border-white/10 bg-white/[0.08]"
                labelClassName="text-white"
                sublabelClassName="text-white/60"
              />
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-200/80">
                  {t("exitIntent.ariaLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Soporte rápido y humano para seguir con confianza.
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              type="button"
              aria-label={t("common.close")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/72 transition-all hover:bg-white/14 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative z-[1] px-5 pb-5 pt-6 text-center sm:px-6 sm:pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/15 shadow-[0_18px_40px_rgba(37,211,102,0.18)]">
            <MessageCircle className="h-8 w-8 text-[#25D366]" />
          </div>

          <h3 className="text-2xl font-black tracking-[-0.04em] text-white">
            {t("exitIntent.title")}
          </h3>
          <p
            id="exit-intent-description"
            className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/70"
          >
            {t("exitIntent.subtitle")}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <MarketingBadgePill
              icon={ShieldCheck}
              label="Pago protegido"
              tone="emerald"
              className="border-white/10 bg-white/[0.07]"
              labelClassName="text-white"
              sublabelClassName="text-white/60"
            />
            <MarketingBadgePill
              label="Respuesta humana"
              tone="sky"
              className="border-white/10 bg-white/[0.07]"
              labelClassName="text-white"
              sublabelClassName="text-white/60"
            />
          </div>

          <div className="mt-6 grid gap-2.5">
            <button
              onClick={openAssistant}
              type="button"
              className={cn(
                "inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl",
                "bg-gradient-to-r from-[#25D366] to-emerald-500 px-4 py-3 text-sm font-semibold text-white",
                "shadow-[0_14px_34px_rgba(0,143,88,0.24)] transition-all duration-300 hover:from-[#20BD5A] hover:to-emerald-600 active:scale-[0.99]",
              )}
            >
              <MessageCircle className="h-5 w-5" />
              {t("assistant.open")}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/74 transition-all hover:bg-white/[0.09] hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              {t("assistant.handoffButton")}
            </a>

            <button
              onClick={dismiss}
              type="button"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm text-white/52 transition-colors hover:bg-white/[0.06] hover:text-white/80"
            >
              {t("exitIntent.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
