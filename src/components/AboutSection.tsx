"use client";

import { Heart, MapPin, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    Icon: MapPin,
    title: "Desde Cúcuta, Colombia",
    text: "Operamos desde Colombia con despachos nacionales y atención local.",
  },
  {
    Icon: MessageCircle,
    title: "Atención directa con Johan",
    text: "Nuestro equipo responde personalmente cada consulta por WhatsApp o correo.",
  },
  {
    Icon: Package,
    title: "Catálogo curado a mano",
    text: "Seleccionamos cada producto por calidad y utilidad antes de publicarlo.",
  },
];

export function AboutSection({ className }: { className?: string }) {
  return (
    <section className={cn("py-12 sm:py-16 bg-[var(--surface)] border-y border-[var(--border)]", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-3">
            <span className="w-5 h-[2px] rounded-full bg-current" />
            Quiénes somos
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Una tienda real, operada por personas reales
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Vortixy nació en Cúcuta con una idea simple: ofrecer productos útiles
            con un proceso de compra transparente. Detrás de cada pedido hay un
            equipo pequeño que revisa, empaca y da seguimiento hasta que el
            producto llega a tu puerta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {VALUES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:border-[var(--accent-strong)]/15 animate-fade-in-up"
            >
              <div className="h-10 w-10 rounded-xl bg-[var(--accent-strong)]/10 text-[var(--accent-strong)] flex items-center justify-center mb-3">
                <item.Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                {item.title}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span>Gracias por apoyar emprendimiento colombiano</span>
        </div>
      </div>
    </section>
  );
}
