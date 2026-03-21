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
    : "Entrega nacional";

  const items: StatItem[] = [
    {
      icon: Clock3,
      eyebrow: "Entrega",
      value: deliveryWindow,
      detail: deliveryEstimate
        ? "Ventana dinámica según ciudad y cobertura."
        : "Estimación visible antes de confirmar el pedido.",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: CreditCard,
      eyebrow: "Pago",
      value: "Contraentrega",
      detail: "Validación manual y pago solo al recibir.",
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      icon: MapPin,
      eyebrow: "Cobertura",
      value: "Toda Colombia",
      detail: "Operación enfocada en compras nacionales.",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      icon: MessageCircleMore,
      eyebrow: "Soporte",
      value: "Canal humano",
      detail: "WhatsApp y correo con contexto del pedido.",
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-start">
      <div className="v-editorial-copy">
        <p className="section-badge">Señales de compra</p>
        <h2 className="text-headline text-[var(--foreground)]">
          Una lectura rápida de lo que realmente importa antes de comprar.
        </h2>
        <p className="v-prose text-sm sm:text-base">
          La experiencia gana claridad cuando el usuario entiende de inmediato
          cómo se paga, cuánto puede tardar y qué canal responde si algo pasa.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.eyebrow}
              className="surface-panel px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--accent)]/20 sm:px-5 sm:py-5"
            >
              <div className="relative z-[1] flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone} shadow-sm`}
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
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
