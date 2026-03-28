"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";

const closingPills = [
  { icon: Truck, label: "Envío nacional visible" },
  { icon: ShieldCheck, label: "Pago contraentrega" },
  { icon: MessageCircle, label: "Soporte humano directo" },
];

export function StorefrontClosingSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-white/80 backdrop-blur">
          Compra clara, cierre simple
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Ya viste el catálogo. Ahora elige con calma y cierra sin fricción.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-emerald-100/82 sm:text-lg">
          Pides cuando tengas claro lo que quieres, pagas cuando llega y mantienes
          el control con soporte real en cada paso.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {closingPills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/88 backdrop-blur"
            >
              <pill.icon className="h-4 w-4 text-emerald-200" />
              {pill.label}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            asChild
            size="lg"
            className="w-full gap-2 border-white/20 bg-white px-8 text-emerald-700 shadow-lg hover:bg-emerald-50 sm:w-auto"
          >
            <Link href="/#productos">
              Ver productos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full gap-2 border-white/30 px-8 text-white hover:bg-white/10 sm:w-auto"
          >
            <Link href="/soporte">
              <MessageCircle className="h-4 w-4" />
              Hablar con soporte
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
