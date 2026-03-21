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
    city: "Bogotá",
    date: "Marzo 2026",
    text: "Tenía dudas porque no conocía la tienda, pero el pago contraentrega me dio tranquilidad. El pedido llegó bien empacado y exactamente como esperaba.",
    rating: 5,
  },
  {
    name: "Andres F.",
    city: "Medellín",
    date: "Febrero 2026",
    text: "Lo que más me gustó fue la claridad. Confirmaron el pedido, avisaron cuando salió y llegó sin sorpresas.",
    rating: 5,
  },
  {
    name: "Luisa P.",
    city: "Bucaramanga",
    date: "Febrero 2026",
    text: "Se siente una compra real. Me respondieron por WhatsApp antes de comprar y el producto sí cumplió con lo prometido.",
    rating: 4,
  },
  {
    name: "David L.",
    city: "Barranquilla",
    date: "Marzo 2026",
    text: "Lo pedí para un regalo y llegó antes de lo esperado. La presentación y el seguimiento hicieron ver todo mucho más serio.",
    rating: 5,
  },
  {
    name: "Sandra V.",
    city: "Pereira",
    date: "Marzo 2026",
    text: "Primera compra y me sentí acompañada durante todo el proceso. El producto llegó completo y la atención fue rápida.",
    rating: 4,
  },
  {
    name: "Jorge R.",
    city: "Cali",
    date: "Febrero 2026",
    text: "Se nota que no quieren vender por vender. La experiencia fue simple, clara y el producto llegó funcionando perfecto.",
    rating: 5,
  },
];

function Stars({ count, dark = false }: { count: number; dark?: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
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
      className={cn("v-section", className)}
      data-tone="contrast"
    >
      <div className="v-section-inner">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)] lg:items-start">
          <div className="surface-panel px-5 py-6 sm:px-7 sm:py-8">
            <div className="relative z-[1] v-editorial-copy">
              <p className="section-badge">{t("testimonials.badge")}</p>
              <h2 className="text-headline text-[var(--foreground)]">
                Prueba social con lectura limpia, no como relleno visual.
              </h2>
              <p className="v-prose text-sm sm:text-base">
                La credibilidad sube cuando las reseñas se ven recientes, bien
                agrupadas y conectadas con la operación real del negocio.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/88 px-4 py-4">
                  <p className="v-kicker">{t("testimonials.perception")}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Stars count={5} />
                    <span className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                      4.8/5
                    </span>
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/88 px-4 py-4">
                  <p className="v-kicker">{t("testimonials.comments")}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                    {t("testimonials.recentVerifiable")}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border-subtle)] bg-white/88 px-4 py-4">
                  <p className="v-kicker">{t("testimonials.coverage")}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                    {t("testimonials.coverageValue")}
                  </p>
                </div>
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
                      ? "surface-panel-dark surface-ambient brand-v-slash px-6 py-6 md:col-span-2"
                      : "surface-panel px-5 py-5",
                  )}
                >
                  <div className={cn("relative z-[1]", featured && "max-w-2xl")}>
                    <Stars count={review.rating} dark={featured} />
                    <p
                      className={cn(
                        "mt-5 text-sm leading-7",
                        featured
                          ? "text-white/84 sm:text-base"
                          : "text-[var(--muted-strong)]",
                      )}
                    >
                      “{review.text}”
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
                          featured ? "ring-white/10" : "ring-[var(--border-subtle)]",
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
                            featured ? "text-white/60" : "text-[var(--muted-soft)]",
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
        </div>

        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted)]">{t("testimonials.basedOn")}</p>
          <Link
            href="/soporte#feedback-form"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent-dim)]"
          >
            {t("testimonials.shareExperience")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="v-section-divider" />
      </div>
    </section>
  );
}
