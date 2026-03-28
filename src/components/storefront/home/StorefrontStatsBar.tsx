"use client";

import { Clock, MapPin, Package } from "lucide-react";

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
      label: "Pedidos completados",
      value: "120+",
      detail: "Cada envío con seguimiento y confirmación.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Clock,
      label: "Tiempo de entrega",
      value: deliveryText,
      detail: "Visible antes de confirmar tu compra.",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: MapPin,
      label: "Cobertura",
      value: "Toda Colombia",
      detail: "Envíos a las principales ciudades del país.",
      color: "from-teal-500 to-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group flex items-center gap-3.5 rounded-[1.45rem] border border-slate-200/80 bg-white/90 px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_24px_60px_rgba(16,185,129,0.12)]"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br ${stat.color} text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]`}
          >
            <stat.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{stat.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
