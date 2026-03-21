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
  "bg-emerald-50 text-emerald-700",
  "bg-indigo-50 text-indigo-700",
  "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
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
          <div key={item.title} className="surface-panel px-3 py-2.5">
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
    <div className={cn("surface-panel px-5 py-6 sm:px-6 sm:py-7", className)}>
      <div className="relative z-[1] mb-5 grid gap-3 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <p className="v-kicker">Compra con respaldo</p>
          <h3 className="mt-2 text-title-lg text-[var(--foreground)]">
            Información clara antes de confirmar el pedido.
          </h3>
        </div>
        <p className="text-sm leading-7 text-[var(--muted)]">
          Pago, garantía, devoluciones, seguridad y soporte visibles dentro del
          mismo recorrido.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {trustItems.map((item, index) => (
          <div
            key={item.title}
            className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/84 px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/20 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
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
            <p className="mt-1.5 text-xs leading-7 text-[var(--muted)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
