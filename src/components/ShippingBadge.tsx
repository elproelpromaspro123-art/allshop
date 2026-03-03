import { Truck, Globe, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShippingBadgeProps {
  stockLocation: "nacional" | "internacional" | "ambos";
  className?: string;
  compact?: boolean;
}

export function ShippingBadge({ stockLocation, className, compact = false }: ShippingBadgeProps) {
  const badges = {
    nacional: {
      icon: Truck,
      label: "Envío Express",
      sublabel: "2-4 días hábiles",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      priority: true,
    },
    internacional: {
      icon: Globe,
      label: "Envío Internacional",
      sublabel: "10-15 días hábiles",
      color: "text-blue-700 bg-blue-50 border-blue-200",
      priority: false,
    },
    ambos: {
      icon: Zap,
      label: "Envío Express Disponible",
      sublabel: "Desde 2 días hábiles",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      priority: true,
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
      {badge.priority && (
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider opacity-60">
          Gratis
        </span>
      )}
    </div>
  );
}
