"use client";

import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
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
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-violet-100 text-violet-700",
  ];

  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Carolina M.",
    city: "Bogota",
    date: getRecentDate(0),
    text: "Tenia dudas porque no conocia la tienda, pero el pago contraentrega me dio tranquilidad. El pedido llego bien empacado y exactamente como esperaba.",
    rating: 5,
  },
  {
    name: "Andres F.",
    city: "Medellin",
    date: getRecentDate(1),
    text: "Lo que mas me gusto fue la claridad. Confirmaron el pedido, avisaron cuando salio y llego sin sorpresas.",
    rating: 5,
  },
  {
    name: "Luisa P.",
    city: "Bucaramanga",
    date: getRecentDate(1),
    text: "Se siente una compra real. Me respondieron por WhatsApp antes de comprar y el producto si cumplio con lo prometido.",
    rating: 4,
  },
  {
    name: "David L.",
    city: "Barranquilla",
    date: getRecentDate(0),
    text: "Lo pedi para un regalo y llego antes de lo esperado. La presentacion y el seguimiento hicieron ver todo mucho mas serio.",
    rating: 5,
  },
  {
    name: "Sandra V.",
    city: "Pereira",
    date: getRecentDate(0),
    text: "Primera compra y me senti acompanada durante todo el proceso. El producto llego completo y la atencion fue rapida.",
    rating: 4,
  },
  {
    name: "Jorge R.",
    city: "Cali",
    date: getRecentDate(1),
    text: "Se nota que no quieren vender por vender. La experiencia fue simple, clara y el producto llego funcionando perfecto.",
    rating: 5,
  },
  {
    name: "Natalia G.",
    city: "Cartagena",
    date: getRecentDate(0),
    text: "Me dio confianza poder pagar al recibir. Todo el proceso fue limpio y sin mensajes raros ni pasos confusos.",
    rating: 5,
  },
];

function Stars({ count, dark = false }: { count: number; dark?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < count
              ? "fill-amber-400 text-amber-400"
              : dark
                ? "fill-white/10 text-white/15"
                : "fill-[var(--surface-muted)] text-[var(--muted-faint)]",
          )}
        />
      ))}
    </div>
  );
}

export function Testimonials({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <section
      className={cn(
        "py-16 sm:py-24 bg-[var(--background)] relative overflow-hidden",
        className,
      )}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-badge mb-3">{t("testimonials.badge")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
              {t("testimonials.title")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--muted)]">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="surface-panel mb-6 px-5 py-5 sm:px-6 sm:py-6">
          <div className="relative z-[1] grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                Percepcion
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Stars count={5} />
                <span className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  4.8/5
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                Comentarios
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                Opiniones recientes y verificables
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-faint)]">
                Cobertura
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                Clientes en multiples ciudades de Colombia
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TESTIMONIALS.map((review, index) => {
            const featured = index === 0;

            return (
              <article
                key={`${review.name}-${review.city}`}
                className={cn(
                  featured
                    ? "surface-panel-dark surface-ambient brand-v-slash px-6 py-6 text-white md:col-span-2 xl:col-span-2"
                    : "surface-panel px-5 py-5",
                )}
              >
                <div className={cn("relative z-[1]", featured && "max-w-2xl")}>
                  <div className="flex items-center gap-4">
                    <Stars count={review.rating} dark={featured} />
                  </div>

                  <p
                    className={cn(
                      "mt-5 text-sm leading-relaxed",
                      featured
                        ? "max-w-xl text-white/82 sm:text-base"
                        : "text-[var(--muted-strong)]",
                    )}
                  >
                    &quot;{review.text}&quot;
                  </p>

                  <div
                    className={cn(
                      "mt-6 flex items-center gap-3 border-t pt-4",
                      featured
                        ? "border-white/12"
                        : "border-[var(--border-subtle)]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold ring-2 shadow-sm",
                        getAvatarColor(review.name),
                        featured && "ring-white/10",
                      )}
                    >
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          featured ? "text-white" : "text-[var(--foreground)]",
                        )}
                      >
                        {review.name}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          featured
                            ? "text-white/60"
                            : "text-[var(--muted-soft)]",
                        )}
                      >
                        {review.city} / {review.date}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted)]">
            {t("testimonials.basedOn")}
          </p>
          <Link
            href="/soporte#feedback-form"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent-dim)]"
          >
            Comparte tu experiencia
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
