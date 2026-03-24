"use client";

import Link from "next/link";
import { ArrowRight, MessageSquareHeart, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionShell } from "@/components/ui/SectionShell";
import { ActionCard } from "@/components/ui/ActionCard";
import { storefrontContent } from "@/content/config/storefront-content";

const TESTIMONIALS = [
  {
    name: "Carolina M.",
    city: "Bogota",
    text: "El pago contraentrega me dio tranquilidad y el pedido llego como esperaba.",
  },
  {
    name: "Andres F.",
    city: "Medellin",
    text: "La compra fue clara de principio a fin y el seguimiento se sintio serio.",
  },
  {
    name: "Sandra V.",
    city: "Pereira",
    text: "La primera compra se sintio acompanada y sin pasos confusos.",
  },
];

export function StorefrontClosingSection() {
  const { closing } = storefrontContent;

  return (
    <section className="v-section" data-density="compact" data-tone="contrast">
      <div className="v-section-inner">
        <SectionShell
          eyebrow={closing.eyebrow}
          title={closing.title}
          description={closing.description}
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
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-faint)]">
                    {testimonial.name} · {testimonial.city}
                  </p>
                </article>
              ))}
            </div>

            <ActionCard
              icon={ShieldCheck}
              title={closing.supportTitle}
              description={closing.supportDescription}
              action={
                <Button asChild className="gap-2">
                  <Link href="/soporte#feedback-form">
                    Ir a soporte
                    <MessageSquareHeart className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/65 px-4 py-4">
            <p className="text-sm text-[var(--muted)]">{closing.footerNote}</p>
            <Link
              href="/soporte#feedback-form"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent-dim)]"
            >
              Compartir experiencia
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </SectionShell>
      </div>
    </section>
  );
}
