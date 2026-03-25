"use client";

import {
  Clock,
  CreditCard,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

const values = [
  {
    icon: CreditCard,
    title: "Pago contra entrega",
    description:
      "Pagas cuando el pedido llega a tu puerta. Sin tarjetas ni anticipos.",
  },
  {
    icon: Truck,
    title: "Envío a todo el país",
    description:
      "Cobertura amplia con información de entrega visible antes de confirmar.",
  },
  {
    icon: Clock,
    title: "Entrega en 3-7 días",
    description:
      "La promesa de tiempos queda integrada al flujo y no escondida al final.",
  },
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    description:
      "Si algo falla con tu pedido, el soporte y la devolución están a un paso.",
  },
  {
    icon: RotateCcw,
    title: "Cambios y devoluciones",
    description:
      "Cinco días para cambios o devoluciones sin pelear contra la interfaz.",
  },
  {
    icon: Headphones,
    title: "Soporte real",
    description:
      "WhatsApp y ayuda humana antes, durante y después de la compra.",
  },
];

export function HomeValues() {
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
            ¿Por qué Vortixy?
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Beneficios repartidos con la misma densidad visual.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Esta sección quedó equilibrada como una sola diapositiva: seis
            promesas concretas, el mismo peso tipográfico y sin tarjetas
            infladas que rompan la simetría.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {values.map((item) => (
            <div
              key={item.title}
              className="group rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_26px_64px_rgba(16,185,129,0.12)] sm:p-6"
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
