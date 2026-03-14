"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHATSAPP_PHONE } from "@/lib/site";
import { useLanguage } from "@/providers/LanguageProvider";

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";
  const { t } = useLanguage();
  const waUrl = useMemo(() => {
    const message = encodeURIComponent(t("whatsapp.message"));
    return `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
  }, [t]);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setHasInteracted(true);
      return !prev;
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* lock body scroll when modal is open on mobile */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, pathname]); // Clean up scroll lock if pathname changes too

  return (
    <>
      {/* â”€â”€ Floating button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <button
        onClick={toggleOpen}
        aria-label={t("whatsapp.open")}
        className={cn(
          "fixed right-5 sm:bottom-6 sm:right-6 z-[55]",
          isCheckout ? "bottom-24" : "bottom-5",
          "flex items-center justify-center gap-2 h-14 rounded-full px-5",
          "bg-[#25D366] text-white shadow-lg",
          "transition-all duration-300",
          "hover:bg-[#20BD5A] hover:scale-110 hover:shadow-[var(--shadow-whatsapp)]",
          "active:scale-95 cursor-pointer"
        )}
      >
        {/* notification dot */}
        {!hasInteracted ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 animate-subtle-pulse">
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white" />
          </span>
        ) : null}
        <WaIcon className="w-6 h-6" />
        <span className="text-sm font-semibold hidden sm:inline">{t("whatsapp.ctaShort")}</span>
      </button>

      {/* â”€â”€ Modal overlay + card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("whatsapp.modalLabel")}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fade-in-up_200ms_ease-out]"
            onClick={close}
          />

          {/* card */}
          <div
            className={cn(
              "relative w-full sm:max-w-sm",
              "bg-white rounded-t-3xl sm:rounded-3xl",
              "shadow-[var(--shadow-elevated)]",
              "animate-[fade-in-up_300ms_ease-out]",
              "overflow-hidden"
            )}
          >
            {/* green header strip */}
            <div className="relative bg-[#25D366] px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 text-white overflow-hidden">
              {/* decorative circles */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

              <button
                onClick={close}
                aria-label={t("common.close")}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <WaIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-bold leading-tight">{t("whatsapp.agentName")}</p>
                  <p className="text-xs text-white/80 mt-0.5">{t("whatsapp.agentRole")}</p>
                </div>
              </div>
            </div>

            {/* body */}
            <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
              {/* chat bubble */}
              <div className="relative bg-[#f0f0f0] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[var(--muted-strong)] leading-relaxed">
                <p>
                  {t("whatsapp.greeting", { name: t("whatsapp.agentName") })}
                </p>
                <p className="mt-1.5">
                  {t("whatsapp.body")}
                </p>
                <span className="block text-[10px] text-[var(--muted-faint)] mt-1.5 text-right">
                  {t("whatsapp.replyNote")}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--muted-faint)]">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                {t("whatsapp.responseTime")}
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className={cn(
                  "flex items-center justify-center gap-2.5 w-full",
                  "h-12 rounded-2xl",
                  "bg-[#25D366] text-white text-sm font-semibold",
                  "shadow-[var(--shadow-whatsapp-soft)]",
                  "hover:bg-[#20BD5A] hover:shadow-[var(--shadow-whatsapp-hover)]",
                  "active:scale-[0.97] transition-all duration-300"
                )}
              >
                <WaIcon className="w-5 h-5" />
                {t("whatsapp.openChat")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

