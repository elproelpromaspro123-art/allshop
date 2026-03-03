"use client";

import { Shield, CreditCard, RotateCcw, Lock, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";

interface TrustBarProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "compact";
}

export function TrustBar({ className, variant = "horizontal" }: TrustBarProps) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const trustItems = [
    {
      icon: Shield,
      title: t("trustbar.guaranteeTitle"),
      description: t("trustbar.guaranteeDesc"),
    },
    {
      icon: CreditCard,
      title: t("trustbar.paymentTitle"),
      description: t("trustbar.paymentDesc"),
    },
    {
      icon: RotateCcw,
      title: t("trustbar.returnsTitle"),
      description: t("trustbar.returnsDesc"),
    },
    {
      icon: Lock,
      title: t("trustbar.securityTitle"),
      description: t("trustbar.securityDesc"),
    },
    {
      icon: Headphones,
      title: t("trustbar.supportTitle"),
      description: t("trustbar.supportDesc"),
    },
  ];

  if (variant === "compact") {
    return (
      <div
        className={cn(
          `flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 ${isDark ? "text-neutral-500" : "text-[var(--muted)]"}`,
          className
        )}
      >
        {trustItems.slice(0, 4).map((item) => (
          <div key={item.title} className="flex items-center gap-1.5">
            <item.icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3"
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark
                  ? "bg-white/[0.05] text-[var(--accent)]"
                  : "bg-[var(--surface-muted)] text-[var(--accent-dim)]"
                }`}
            >
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-[var(--foreground)]"
                  }`}
              >
                {item.title}
              </p>
              <p
                className={`text-xs ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                  }`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {trustItems.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center text-center gap-2 p-4"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark
                ? "bg-white/[0.05] text-[var(--accent)]"
                : "bg-[var(--surface-muted)] text-[var(--accent-dim)]"
              }`}
          >
            <item.icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
            >
              {item.title}
            </p>
            <p
              className={`text-xs ${isDark ? "text-neutral-500" : "text-[var(--muted)]"
                }`}
            >
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
