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
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
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
          "flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 text-[var(--muted)]",
          className
        )}
      >
        {trustItems.slice(0, 4).map((item, i) => (
          <div key={item.title} className="flex items-center gap-1.5 group">
            <item.Icon className={cn("w-4 h-4 transition-colors", ICON_STYLES[i].split(" ")[1])} />
            <span className="text-xs font-medium">{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item, i) => (
          <div
            key={item.title}
            className="flex items-start gap-3 group"
          >
            <div
              className={cn(
                "shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 group-hover:scale-105 border-[var(--border)] group-hover:border-[var(--accent-strong)]/30",
                ICON_STYLES[i]
              )}
            >
              <item.Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3", className)}>
      {trustItems.map((item, i) => (
        <div
          key={item.title}
          className="group flex flex-col items-center text-center gap-3 p-5 sm:p-6 bento-card cursor-default transition-colors hover:bg-[var(--accent-surface)]/30"
        >
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
              ICON_STYLES[i]
            )}
          >
            <item.Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {item.title}
            </p>
            <p className="text-xs mt-1 text-[var(--muted)] leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
