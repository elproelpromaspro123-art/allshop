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
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      iconBg: "bg-emerald-100",
    },
    internacional: {
      Icon: Waypoints,
      label: t("shipping.internationalLabel"),
      sublabel: t("shipping.internationalSublabel"),
      color: "text-sky-700 bg-sky-50 border-sky-200",
      iconBg: "bg-sky-100",
    },
    ambos: {
      Icon: Route,
      label: t("shipping.flexLabel"),
      sublabel: t("shipping.flexSublabel"),
      color: "text-violet-700 bg-violet-50 border-violet-200",
      iconBg: "bg-violet-100",
    },
  };

  const badge = badges[stockLocation];

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
          badge.color,
          className
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
        "flex items-center gap-3 p-3 rounded-xl border",
        badge.color,
        className
      )}
    >
      <div className={cn("shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", badge.iconBg)}>
        <badge.Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{badge.label}</p>
        <p className="text-xs opacity-75">{badge.sublabel}</p>
      </div>
    </div>
  );
}
