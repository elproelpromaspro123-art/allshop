"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface GuaranteeSealProps {
  variant?: "inline" | "card";
  className?: string;
}

export function GuaranteeSeal({ variant = "inline", className }: GuaranteeSealProps) {
  const { t } = useLanguage();

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--accent)]/15 bg-gradient-to-r from-[var(--accent-surface)] to-transparent p-5 sm:p-6 flex items-start gap-4",
          className
        )}
      >
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] flex items-center justify-center shadow-[var(--shadow-button)] animate-pulse-glow">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--foreground)] mb-1">
            {t("guarantee.title") || "Garantía Contraentrega"}
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {t("guarantee.text") || "Pagas solo cuando recibes tu producto. Sin riesgo, sin sorpresas — revisa tu pedido antes de pagar."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-surface)] px-4 py-2",
        className
      )}
    >
      <CheckCircle2 className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
      <span className="text-xs font-semibold text-[var(--accent-dim)]">
        {t("guarantee.badge") || "Garantía Contraentrega · Pagas al recibir"}
      </span>
    </div>
  );
}
