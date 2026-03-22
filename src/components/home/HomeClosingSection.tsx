"use client";

import Link from "next/link";
import { ArrowRight, MessageSquareHeart, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionShell } from "@/components/ui/SectionShell";
import { ActionCard } from "@/components/ui/ActionCard";

const TESTIMONIALS = [
  {
    name: "Carolina M.",
    city: "Bogotá",
    text: "El pago contraentrega me dio tranquilidad y el pedido llegó como esperaba.",
  },
  {
    name: "Andrés F.",
    city: "Medellín",
    text: "La compra fue clara de principio a fin y el seguimiento se sintió serio.",
  },
  {
    name: "Sandra V.",
    city: "Pereira",
    text: "La primera compra se sintió acompañada y sin pasos confusos.",
  },
];

export function HomeClosingSection() {
  return (
    <section className="v-section" data-tone="contrast">
      <div className="v-section-inner">
        <SectionShell
          eyebrow="Prueba social y soporte"
          title="Confianza visible y ayuda real en el mismo cierre."
          description="Cerramos la página con señales concretas de confianza y un punto de soporte claro, sin volver a repetir todo el discurso comercial."
          contentClassName="storefront-rhythm"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/92 px-4 py-4"
                >
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                    “{testimonial.text}”
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-faint)]">
                    {testimonial.name} · {testimonial.city}
                  </p>
                </article>
              ))}
            </div>

            <ActionCard
              icon={ShieldCheck}
              title="¿Necesitas ayuda antes de comprar?"
              description="El punto de contacto queda claro al final de la experiencia para que resuelvas dudas sin salir del flujo."
              action={
                <Link href="/soporte#feedback-form" className="inline-flex">
                  <Button className="gap-2">
                    Ir a soporte
                    <MessageSquareHeart className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/65 px-4 py-4">
            <p className="text-sm text-[var(--muted)]">
              Opiniones recientes, soporte directo y contraentrega visibles sin saturar el resto del recorrido.
            </p>
            <Link
              href="/soporte#feedback-form"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent-dim)]"
            >
              Compartir experiencia
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </SectionShell>
        <div className="v-section-divider" />
      </div>
    </section>
  );
}
