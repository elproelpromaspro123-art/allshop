"use client";

import { ShieldCheck, Truck, Clock, CreditCard, Headphones, RotateCcw } from "lucide-react";

const values = [
  {
    icon: CreditCard,
    title: "Pago contra entrega",
    description: "Pagas cuando el pedido llega a tu puerta. Sin tarjetas, sin anticipos.",
  },
  {
    icon: Truck,
    title: "Envío a todo el país",
    description: "Cobertura en las principales ciudades y municipios del país.",
  },
  {
    icon: Clock,
    title: "Entrega en 3-7 días",
    description: "Tu pedido sale rápido. Ves el tiempo estimado antes de confirmar.",
  },
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    description: "Si algo no sale bien con tu pedido, te ayudamos a resolverlo.",
  },
  {
    icon: RotateCcw,
    title: "Cambios y devoluciones",
    description: "5 días después de recibir para pedir cambio o devolución.",
  },
  {
    icon: Headphones,
    title: "Soporte real",
    description: "Te ayudamos por WhatsApp antes, durante y después de tu compra.",
  },
];

export function HomeValues() {
  return (
    <section className="bg-gradient-to-b from-gray-50/60 to-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            ¿Por qué Vortixy?
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Comprar tiene que ser simple
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-gray-500">
            Lo esencial para que compres tranquilo: envío real, pago seguro y soporte directo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 transition-all duration-300 group-hover:from-emerald-100 group-hover:to-teal-100">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
