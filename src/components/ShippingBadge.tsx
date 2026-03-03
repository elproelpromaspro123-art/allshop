"use client";

import { Truck, Globe, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";

interface ShippingBadgeProps {
  stockLocation: "nacional" | "internacional" | "ambos";
  className?: string;
  compact?: boolean;
}

export function ShippingBadge({
  stockLocation,
  className,
  compact = false,
}: ShippingBadgeProps) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const badges = {
    nacional: {
      icon: Truck,
      label: t("shipping.nationalLabel"),
      sublabel: t("shipping.nationalSublabel"),
      color: isDark
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    internacional: {
      icon: Globe,
      label: t("shipping.internationalLabel"),
      sublabel: t("shipping.internationalSublabel"),
      color: isDark
        ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
        : "text-sky-700 bg-sky-50 border-sky-200",
    },
    ambos: {
      icon: Zap,
      label: t("shipping.flexLabel"),
      sublabel: t("shipping.flexSublabel"),
      color: isDark
        ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
        : "text-violet-700 bg-violet-50 border-violet-200",
    },
  };

  const badge = badges[stockLocation];
  const Icon = badge.icon;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
          badge.color,
          className
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border",
        badge.color,
        className
      )}
    >
      <div className="shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{badge.label}</p>
        <p className="text-xs opacity-75">{badge.sublabel}</p>
      </div>
    </div>
  );
}
