"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface Testimonial {
  name: string;
  city: string;
  date: string;
  text: string;
  rating: number;
}

function getRecentDate(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Carolina M.",
    city: "Bogota",
    date: getRecentDate(1),
    text: "La verdad tenia mis dudas porque no conocia la tienda, pero me anime por el pago contra entrega. Llego en 4 dias y todo bien, tal cual las fotos.",
    rating: 5,
  },
  {
    name: "Andres F.",
    city: "Medellin",
    date: getRecentDate(2),
    text: "Lo bueno es que uno paga cuando recibe. Me llego el correo de confirmacion y despues me avisaron cuando despacharon. Todo transparente.",
    rating: 4,
  },
  {
    name: "Luisa P.",
    city: "Bucaramanga",
    date: getRecentDate(2),
    text: "Pedi la camara y funciono, pero el manual viene en ingles y me toco buscar tutorial en YouTube. El producto como tal si sirve.",
    rating: 3,
  },
  {
    name: "David L.",
    city: "Barranquilla",
    date: getRecentDate(0),
    text: "Se lo compre a mi mama y quedo contenta. Llego antes de lo que esperaba y bien empacado. Por ahora todo bien.",
    rating: 5,
  },
  {
    name: "Sandra V.",
    city: "Pereira",
    date: getRecentDate(0),
    text: "Primer pedido aqui. Respondieron rapido por WhatsApp cuando pregunte por el envio. El producto llego bien, nada del otro mundo pero cumple.",
    rating: 4,
  },
  {
    name: "Jorge R.",
    city: "Cali",
    date: getRecentDate(1),
    text: "Compre los audifonos y la calidad de sonido esta buena para el precio. El envio demoro un poco mas de lo esperado pero llego completo.",
    rating: 4,
  },
  {
    name: "Natalia G.",
    city: "Cartagena",
    date: getRecentDate(0),
    text: "Me encanto la atencion al cliente, me respondieron todas las dudas antes de comprar. El producto llego en perfectas condiciones.",
    rating: 5,
  },
  {
    name: "Miguel A.",
    city: "Manizales",
    date: getRecentDate(1),
    text: "Buen producto, funciona como se describe. Lo unico es que el empaque podria ser mejor, pero el producto en si esta bien.",
    rating: 4,
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
              : "fill-[var(--surface-muted)] text-[var(--muted-faint)]"
          )}
        />
      ))}
    </div>
  );
}

export function Testimonials({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <section className={cn("py-16 sm:py-24 bg-[var(--background)] relative overflow-hidden", className)}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="section-badge mb-3">
            {t("testimonials.badge")}
          </p>
          <h2 className="text-[var(--foreground)]">
            <span className="text-gradient-subtle">{t("testimonials.title")}</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--muted)] max-w-lg leading-relaxed">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="flex overflow-x-auto pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 snap-x snap-mandatory hide-scrollbar">
          {TESTIMONIALS.map((review, index) => (
            <article
              key={review.name}
              className={cn(
                "min-w-[280px] sm:min-w-0 snap-center bento-card p-5 flex flex-col gap-3",
                index === 0 && "bento-card-accent"
              )}
            >
              <Stars count={review.rating} />
              <p className="text-sm text-[var(--muted-strong)] leading-relaxed flex-1">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  getAvatarColor(review.name)
                )}>
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {review.name}
                  </p>
                  <p className="text-xs text-[var(--muted-soft)]">
                    {review.city} &middot; {review.date}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span className="font-bold text-[var(--foreground)]">4.2/5</span>
          </span>
          <span className="w-px h-4 bg-[var(--border)]" />
          <span>{t("testimonials.basedOn")}</span>
        </div>
      </div>
    </section>
  );
}
