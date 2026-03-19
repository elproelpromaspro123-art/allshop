"use client";

import { Route, Truck, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

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

  const badges = {
    nacional: {
      Icon: Truck,
      label: t("shipping.nationalLabel"),
      sublabel: t("shipping.nationalSublabel"),
      gradient: "from-emerald-50 to-teal-50",
      border: "border-emerald-200/60",
      text: "text-emerald-800",
      iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
      iconColor: "text-emerald-700",
    },
    internacional: {
      Icon: Waypoints,
      label: t("shipping.internationalLabel"),
      sublabel: t("shipping.internationalSublabel"),
      gradient: "from-sky-50 to-blue-50",
      border: "border-sky-200/60",
      text: "text-sky-800",
      iconBg: "bg-gradient-to-br from-sky-100 to-sky-200",
      iconColor: "text-sky-700",
    },
    ambos: {
      Icon: Route,
      label: t("shipping.flexLabel"),
      sublabel: t("shipping.flexSublabel"),
      gradient: "from-violet-50 to-purple-50",
      border: "border-violet-200/60",
      text: "text-violet-800",
      iconBg: "bg-gradient-to-br from-violet-100 to-violet-200",
      iconColor: "text-violet-700",
    },
  };

  const badge = badges[stockLocation];

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r",
          badge.gradient,
          badge.border,
          badge.text,
          className,
        )}
      >
        <badge.Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-xl border bg-gradient-to-r shadow-sm",
        badge.gradient,
        badge.border,
        badge.text,
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
          badge.iconBg,
        )}
      >
        <badge.Icon className={cn("w-5 h-5", badge.iconColor)} />
      </div>
      <div>
        <p className="text-sm font-bold">{badge.label}</p>
        <p className="text-xs opacity-70 mt-0.5">{badge.sublabel}</p>
      </div>
    </div>
  );
}
