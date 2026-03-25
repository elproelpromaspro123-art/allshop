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
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Clock,
      label: "Tiempo de entrega",
      value: deliveryText,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: MapPin,
      label: "Cobertura",
      value: "Todo Colombia",
      color: "from-teal-500 to-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:border-emerald-200/50 hover:shadow-md"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{stat.label}</p>
            <p className="text-sm font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
