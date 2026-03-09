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
    text: "Hice mi primer pedido con algo de desconfianza, pero llegó en 4 días y exactamente como lo mostraban. Ya hice un segundo pedido.",
    rating: 5,
    product: "Organizador de cocina",
  },
  {
    name: "Andrés F.",
    city: "Medellín",
    date: "Enero 2026",
    text: "Lo mejor es que pagas al recibir. Me confirmaron el pedido por correo y me avisaron cuando salió. Muy transparente todo.",
    rating: 5,
    product: "Lámpara LED recargable",
  },
  {
    name: "María José R.",
    city: "Cali",
    date: "Febrero 2026",
    text: "Tenía dudas porque la tienda es nueva, pero el proceso fue serio. Respondieron rápido por soporte y el producto llegó bien empacado.",
    rating: 4,
    product: "Set de bandas elásticas",
  },
  {
    name: "David L.",
    city: "Barranquilla",
    date: "Marzo 2026",
    text: "Pedí un producto para mi mamá y llegó antes de lo esperado. El seguimiento funcionó bien y el empaque estaba impecable.",
    rating: 5,
    product: "Masajeador facial",
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
            <span className="font-semibold text-[var(--foreground)]">4.8/5</span>
          </span>
          <span className="w-px h-3.5 bg-neutral-300" />
          <span>basado en +150 pedidos entregados</span>
        </div>
      </div>
    </section>
  );
}
