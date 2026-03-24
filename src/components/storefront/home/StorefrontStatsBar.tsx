"use client";

import { Package, Clock, MapPin } from "lucide-react";

interface StorefrontStatsBarProps {
  deliveryEstimate: { min: number; max: number } | null;
}

export function StorefrontStatsBar({ deliveryEstimate }: StorefrontStatsBarProps) {
  const deliveryText = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "3-7 días hábiles";

  const stats = [
    {
      icon: Package,
      label: "Pedidos entregados",
      value: "2,800+",
    },
    {
      icon: Clock,
      label: "Tiempo de entrega",
      value: deliveryText,
    },
    {
      icon: MapPin,
      label: "Cobertura",
      value: "Todo Colombia",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <stat.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400">{stat.label}</p>
            <p className="text-sm font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
