"use client";

import {
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  ShieldEllipsis,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface TrustBarProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "compact";
}

const ICON_STYLES = [
  "bg-emerald-50 text-emerald-600",
  "bg-indigo-50 text-indigo-600",
  "bg-amber-50 text-amber-600",
  "bg-sky-50 text-sky-600",
  "bg-violet-50 text-violet-600",
];

export function TrustBar({ className, variant = "horizontal" }: TrustBarProps) {
  const { t } = useLanguage();

  const trustItems = [
    {
      Icon: ShieldCheck,
      title: t("trustbar.guaranteeTitle"),
      description: t("trustbar.guaranteeDesc"),
    },
    {
      Icon: CreditCard,
      title: t("trustbar.paymentTitle"),
      description: t("trustbar.paymentDesc"),
    },
    {
      Icon: RotateCcw,
      title: t("trustbar.returnsTitle"),
      description: t("trustbar.returnsDesc"),
    },
    {
      Icon: ShieldEllipsis,
      title: t("trustbar.securityTitle"),
      description: t("trustbar.securityDesc"),
    },
    {
      Icon: Headset,
      title: t("trustbar.supportTitle"),
      description: t("trustbar.supportDesc"),
    },
  ];

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5",
          className,
        )}
      >
        {trustItems.slice(0, 4).map((item, index) => (
          <div key={item.title} className="surface-panel px-3 py-2">
            <div className="relative z-[1] flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-xl",
                  ICON_STYLES[index],
                )}
              >
                <item.Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-[var(--foreground)]">
                {item.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item, index) => (
          <div key={item.title} className="surface-panel px-4 py-4">
            <div className="relative z-[1] flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  ICON_STYLES[index],
                )}
              >
                <item.Icon className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("surface-panel px-4 py-5 sm:px-6 sm:py-6", className)}>
      <div className="relative z-[1] mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
            Compra con contexto
          </p>
          <h3 className="mt-2 text-title-lg text-[var(--foreground)]">
            Claridad operativa en cada etapa.
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Diseñamos la experiencia para que comprar sea simple, verificable y
          humana desde el primer clic.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {trustItems.map((item, index) => (
          <div
            key={item.title}
            className="rounded-[18px] border border-[var(--border-subtle)] bg-white/80 px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/8 hover:shadow-[0_14px_32px_rgba(10,15,30,0.08)]"
          >
            <div
              className={cn(
                "mb-3 flex h-10 w-10 items-center justify-center rounded-2xl",
                ICON_STYLES[index],
              )}
            >
              <item.Icon className="h-[18px] w-[18px]" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {item.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
