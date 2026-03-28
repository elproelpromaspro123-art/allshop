"use client";

import { Clock3, CreditCard, MapPin, MessageCircleMore } from "lucide-react";
import type { DeliveryEstimateRange } from "@/hooks/useDeliveryEstimate";

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
        ? "Tiempo aproximado según tu ciudad y cobertura."
        : "Tiempo estimado visible antes de confirmar.",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: CreditCard,
      eyebrow: "Pago",
      value: "Pago al recibir",
      detail: "Haces el pedido y pagas cuando lo recibes.",
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      icon: MapPin,
      eyebrow: "Cobertura",
      value: "Toda Colombia",
      detail: "Enviamos a la mayor parte de ciudades del país.",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      icon: MessageCircleMore,
      eyebrow: "Soporte",
      value: "Atención humana",
      detail: "WhatsApp y correo para ayudarte con el pedido.",
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Antes de pedir</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Lo que conviene revisar antes de hacer tu pedido.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
          Aquí tienes lo más importante: entrega, pago, cobertura y soporte.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.eyebrow}
              className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md sm:px-5 sm:py-5"
            >
              <div className="relative z-[1] flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone} shadow-sm`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {item.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 sm:text-base">
                    {item.value}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
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
