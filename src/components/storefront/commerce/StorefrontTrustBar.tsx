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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {trustItems.map((item) => (
        <div
          key={item.title}
          className="group rounded-[1.45rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_24px_60px_rgba(16,185,129,0.12)] sm:p-5"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 transition-all duration-300 group-hover:from-emerald-100 group-hover:to-teal-100">
            <item.icon className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
