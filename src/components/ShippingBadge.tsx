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

export function ShippingBadge({ stockLocation, className, compact = false }: ShippingBadgeProps) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const badges = {
    nacional: {
      icon: Truck,
      label: t("shipping.nationalLabel"),
      sublabel: t("shipping.nationalSublabel"),
      color: isDark
        ? "text-[#9bfca6] bg-[rgba(73,204,104,0.18)] border-[rgba(132,251,127,0.35)]"
        : "text-[#1f8f45] bg-[#e9f8ee] border-[#b9ecc7]",
    },
    internacional: {
      icon: Globe,
      label: t("shipping.internationalLabel"),
      sublabel: t("shipping.internationalSublabel"),
      color: isDark
        ? "text-[#99e8bf] bg-[rgba(52,181,143,0.18)] border-[rgba(111,230,183,0.35)]"
        : "text-[#1d7f66] bg-[#e8f7f1] border-[#bee9d7]",
    },
    ambos: {
      icon: Zap,
      label: t("shipping.flexLabel"),
      sublabel: t("shipping.flexSublabel"),
      color: isDark
        ? "text-emerald-300 bg-emerald-500/15 border-emerald-400/30"
        : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  };

  const badge = badges[stockLocation];
  const Icon = badge.icon;

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", badge.color, className)}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border", badge.color, className)}>
      <div className="flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{badge.label}</p>
        <p className="text-xs opacity-80">{badge.sublabel}</p>
      </div>
    </div>
  );
}
