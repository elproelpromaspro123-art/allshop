"use client";

import { ShieldCheck, Truck, Clock, CreditCard, Headphones, RotateCcw } from "lucide-react";

const values = [
  {
    icon: CreditCard,
    title: "Pago contra entrega",
    description: "Solo pagas cuando el pedido llega a tu puerta. Sin tarjetas ni pagos anticipados.",
  },
  {
    icon: Truck,
    title: "Envío a todo el país",
    description: "Cobertura nacional. Llegamos a las principales ciudades y municipios de Colombia.",
  },
  {
    icon: Clock,
    title: "Entrega en 3-7 días",
    description: "Tu pedido sale rápido. Tiempos estimados visibles antes de confirmar la compra.",
  },
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    description: "Si algo no está bien con tu pedido, lo solucionamos. Tu compra tiene respaldo.",
  },
  {
    icon: RotateCcw,
    title: "Cambios y devoluciones",
    description: "Tienes 5 días después de recibir para solicitar cambio o devolución.",
  },
  {
    icon: Headphones,
    title: "Soporte real",
    description: "Personas reales te ayudan antes, durante y después de tu compra por WhatsApp.",
  },
];

export function HomeValues() {
  return (
    <section className="bg-gray-50/80 py-14 sm:py-20">
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
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-100">
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
