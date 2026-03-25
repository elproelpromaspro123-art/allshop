"use client";

import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    description: "Tu pedido llega o te devolvemos el dinero",
  },
  {
    icon: Truck,
    title: "Envío nacional",
    description: "Llegamos a cualquier ciudad de Colombia",
  },
  {
    icon: RotateCcw,
    title: "Devoluciones",
    description: "5 días para cambios o devoluciones",
  },
  {
    icon: Headphones,
    title: "Soporte directo",
    description: "Te ayudamos por WhatsApp antes y después",
  },
];

export function StorefrontTrustBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {trustItems.map((item) => (
        <div
          key={item.title}
          className="group rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200/50 hover:shadow-md sm:p-5"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 transition-all duration-300 group-hover:from-emerald-100 group-hover:to-teal-100">
            <item.icon className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
