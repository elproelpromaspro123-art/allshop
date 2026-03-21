"use client";

import { Clock3, CreditCard, MapPin, MessageCircleMore } from "lucide-react";
import type { DeliveryEstimateRange } from "@/lib/use-delivery-estimate";

interface StatsBarProps {
  deliveryEstimate?: DeliveryEstimateRange | null;
}

interface StatItem {
  icon: typeof Clock3;
  eyebrow: string;
  value: string;
  detail: string;
  tone: string;
}

export function StatsBar({ deliveryEstimate = null }: StatsBarProps) {
  const deliveryWindow = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "3-7 días hábiles";

  const items: StatItem[] = [
    {
      icon: Clock3,
      eyebrow: "Entrega",
      value: deliveryWindow,
      detail: "Despachos nacionales con seguimiento.",
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: CreditCard,
      eyebrow: "Pago",
      value: "Contraentrega",
      detail: "Paga cuando el pedido llega a tu dirección.",
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: MapPin,
      eyebrow: "Cobertura",
      value: "Toda Colombia",
      detail: "Operación pensada para compras nacionales.",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      icon: MessageCircleMore,
      eyebrow: "Soporte",
      value: "Canal humano",
      detail: "Acompañamiento por WhatsApp y correo.",
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.eyebrow}
            className="surface-panel px-4 py-4 sm:px-5 sm:py-[1.125rem] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            <div className="relative z-[1] flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                  {item.eyebrow}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                  {item.value}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {item.detail}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
