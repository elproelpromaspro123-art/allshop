"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  city: string;
  date: string;
  text: string;
  rating: number;
  product: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Carolina M.",
    city: "Bogotá",
    date: "Febrero 2026",
    text: "La verdad tenía mis dudas porque no conocía la tienda, pero me animé por el pago contra entrega. Llegó en 4 días y todo bien, tal cual las fotos.",
    rating: 5,
    product: "Air Fryer Freidora de Aire 10L",
  },
  {
    name: "Andrés F.",
    city: "Medellín",
    date: "Enero 2026",
    text: "Lo bueno es que uno paga cuando recibe. Me llegó el correo de confirmación y después me avisaron cuando despacharon. Todo transparente.",
    rating: 4,
    product: "Audífonos Xiaomi Redmi Buds 4 Lite",
  },
  {
    name: "Luisa P.",
    city: "Bucaramanga",
    date: "Febrero 2026",
    text: "Pedí la cámara y funcionó, pero el manual viene en inglés y me tocó buscar tutorial en YouTube. El producto como tal sí sirve.",
    rating: 3,
    product: "Cámara de Seguridad Bombillo 360°",
  },
  {
    name: "David L.",
    city: "Barranquilla",
    date: "Marzo 2026",
    text: "Se lo compré a mi mamá y quedó contenta. Llegó antes de lo que esperaba y bien empacado. Por ahora todo bien.",
    rating: 5,
    product: "Cepillo Eléctrico 5 en 1",
  },
  {
    name: "Sandra V.",
    city: "Pereira",
    date: "Marzo 2026",
    text: "Primer pedido aquí. Respondieron rápido por WhatsApp cuando pregunté por el envío. El producto llegó bien, nada del otro mundo pero cumple.",
    rating: 4,
    product: "Organizador Multiusos",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 text-neutral-200"
          )}
        />
      ))}
    </div>
  );
}

export function Testimonials({ className }: { className?: string }) {
  return (
    <section className={cn("py-12 sm:py-16 bg-[var(--background)]", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)] mb-3">
            <span className="w-5 h-[2px] rounded-full bg-current" />
            Experiencias reales
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Lo que dicen nuestros compradores
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-xl">
            Opiniones verificadas de clientes que recibieron su pedido contra
            entrega en Colombia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:border-[var(--accent-strong)]/15"
            >
              <Stars count={t.rating} />
              <p className="text-sm text-neutral-700 leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t.name}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {t.city} · {t.date}
                </p>
                <p className="text-[10px] font-medium text-[var(--accent-strong)] mt-1">
                  Compró: {t.product}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span className="font-semibold text-[var(--foreground)]">4.6/5</span>
          </span>
          <span className="w-px h-3.5 bg-neutral-300" />
          <span>basado en +50 pedidos entregados</span>
        </div>
      </div>
    </section>
  );
}
