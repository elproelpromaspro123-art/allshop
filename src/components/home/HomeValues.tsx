"use client";

import {
  Clock,
  CreditCard,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";

export function HomeValues() {
  const deliveryEstimate = useDeliveryEstimate();
  const deliveryText = deliveryEstimate
    ? `Tu pedido llega entre ${deliveryEstimate.min} y ${deliveryEstimate.max} dias habiles, con seguimiento en cada paso.`
    : "Tu pedido llega entre 3 y 7 dias habiles, con seguimiento en cada paso.";

  const values = [
    {
      icon: CreditCard,
      title: "Pago contra entrega",
      description:
        "No necesitas tarjeta. Pagas en efectivo cuando el pedido llega a tu puerta.",
    },
    {
      icon: Truck,
      title: "Envio a todo el pais",
      description:
        "Enviamos a cualquier ciudad de Colombia. Los tiempos se ven antes de confirmar.",
    },
    {
      icon: Clock,
      title: deliveryEstimate
        ? `Entrega en ${deliveryEstimate.min}-${deliveryEstimate.max} dias`
        : "Entrega en 3-7 dias",
      description: deliveryText,
    },
    {
      icon: ShieldCheck,
      title: "Compra protegida",
      description:
        "Si algo no esta bien con tu pedido, lo resolvemos. Sin vueltas ni excusas.",
    },
    {
      icon: RotateCcw,
      title: "Cambios y devoluciones",
      description:
        "Tienes 5 dias para pedir un cambio o devolucion si algo no te convence.",
    },
    {
      icon: Headphones,
      title: "Soporte por WhatsApp",
      description:
        "Una persona real te atiende por WhatsApp. Antes, durante y despues de tu compra.",
    },
  ];

  return (
    <section
      data-home-slide=""
      data-density="balanced"
      data-tone="warm"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-emerald-700">
            Porque comprar aqui?
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Seis razones para hacer tu pedido hoy
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Cada detalle esta pensado para que tu compra sea simple, segura
            y sin sorpresas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {values.map((item) => (
            <div
              key={item.title}
              className="group rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_26px_64px_rgba(16,185,129,0.12)] sm:p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 transition-all duration-300 group-hover:from-emerald-100 group-hover:to-teal-100">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="v-section-divider" />
    </section>
  );
}
