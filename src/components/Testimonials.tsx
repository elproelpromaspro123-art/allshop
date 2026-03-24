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

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Carolina M.",
    city: "Bogotá",
    date: "Marzo 2026",
    text: "Tenía dudas porque no conocía la tienda, pero el pago contraentrega me dio tranquilidad. El pedido llegó bien empacado y exactamente como esperaba.",
    rating: 5,
  },
  {
    name: "Andrés F.",
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

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < count
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200",
          )}
        />
      ))}
    </div>
  );
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
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Testimonials({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <section className={cn("py-14 sm:py-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              {t("testimonials.badge")}
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Clientes que ya recibieron su pedido
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Stars count={5} />
            <span className="text-lg font-bold text-gray-900">4.8/5</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((review) => (
            <article
              key={`${review.name}-${review.city}`}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <Stars count={review.rating} />
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
                    getAvatarColor(review.name),
                  )}
                >
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {review.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.city} · {review.date}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">{t("testimonials.basedOn")}</p>
          <Link
            href="/soporte#feedback-form"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            {t("testimonials.shareExperience")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
