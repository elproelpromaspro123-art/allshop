"use client";

import { Route, Truck, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MarketingBadgePill,
  type MarketingTone,
} from "@/components/marketing/MarketingPrimitives";

interface ShippingBadgeProps {
  stockLocation: "nacional" | "internacional" | "ambos";
  className?: string;
  compact?: boolean;
}

const shippingVariants: Record<
  ShippingBadgeProps["stockLocation"],
  {
    Icon: typeof Truck;
    label: string;
    sublabel: string;
    tone: MarketingTone;
    accent: string;
    border: string;
    text: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  nacional: {
    Icon: Truck,
    label: "Envío nacional",
    sublabel: "Cobertura dentro de Colombia",
    tone: "emerald",
    accent: "from-emerald-50 to-teal-50",
    border: "border-emerald-200/70",
    text: "text-emerald-800",
    iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
    iconColor: "text-emerald-700",
  },
  internacional: {
    Icon: Waypoints,
    label: "Envío internacional",
    sublabel: "Cobertura fuera del país",
    tone: "sky",
    accent: "from-sky-50 to-blue-50",
    border: "border-sky-200/70",
    text: "text-sky-800",
    iconBg: "bg-gradient-to-br from-sky-100 to-sky-200",
    iconColor: "text-sky-700",
  },
  ambos: {
    Icon: Route,
    label: "Cobertura mixta",
    sublabel: "Opciones nacional e internacional",
    tone: "violet",
    accent: "from-violet-50 to-purple-50",
    border: "border-violet-200/70",
    text: "text-violet-800",
    iconBg: "bg-gradient-to-br from-violet-100 to-violet-200",
    iconColor: "text-violet-700",
  },
};

export function ShippingBadge({
  stockLocation,
  className,
  compact = false,
}: ShippingBadgeProps) {
  const badge = shippingVariants[stockLocation];

  if (compact) {
    return (
      <MarketingBadgePill
        icon={badge.Icon}
        label={badge.label}
        sublabel={badge.sublabel}
        tone={badge.tone}
        className={cn("max-w-full", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[1.25rem] border bg-gradient-to-r px-3.5 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
        badge.accent,
        badge.border,
        badge.text,
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/60",
          badge.iconBg,
        )}
      >
        <badge.Icon className={cn("h-5 w-5", badge.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-[-0.02em]">{badge.label}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          {badge.sublabel}
        </p>
      </div>
    </div>
  );
}
