"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface GuaranteeSealProps {
  variant?: "inline" | "card";
  className?: string;
}

export function GuaranteeSeal({
  variant = "inline",
  className,
}: GuaranteeSealProps) {
  const { t } = useLanguage();

  if (variant === "card") {
    return (
      <div
        className={cn(
          "surface-panel px-5 py-5 sm:px-6 sm:py-6",
          className
        )}
      >
        <div className="relative z-[1] flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#009e61_0%,#00c879_100%)] text-white shadow-[var(--shadow-button)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
              Confianza Vortixy
            </p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {t("guarantee.title") || "Garantia Contraentrega"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {t("guarantee.text") ||
                "Pagas cuando recibes tu pedido. Antes revisas el paquete, confirmas la compra y sigues con total claridad."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-emerald-500/15 bg-white/82 px-4 py-2 shadow-[0_10px_24px_rgba(10,15,30,0.06)] backdrop-blur-xl",
        className
      )}
    >
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[var(--accent-strong)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <span className="text-xs font-semibold text-[var(--muted-strong)]">
        {t("guarantee.badge") || "Garantia Contraentrega / Pagas al recibir"}
      </span>
    </div>
  );
}
