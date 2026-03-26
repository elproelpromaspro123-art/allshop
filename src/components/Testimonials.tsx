"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  MarketingBadgePill,
  MarketingQuoteCard,
  MarketingSectionHeader,
  MarketingSurface,
} from "@/components/marketing/MarketingPrimitives";

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

export function Testimonials({ className }: { className?: string }) {
  const { t } = useLanguage();

  const overviewCards = [
    {
      label: t("testimonials.perception"),
      value: "4.8/5",
      tone: "emerald" as const,
    },
    {
      label: t("testimonials.comments"),
      value: t("testimonials.recentVerifiable"),
      tone: "sky" as const,
    },
    {
      label: t("testimonials.coverage"),
      value: t("testimonials.coverageValue"),
      tone: "violet" as const,
    },
  ];

  return (
    <section className={cn("py-14 sm:py-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MarketingSurface className="px-5 py-5 sm:px-6 sm:py-6" tone="sky">
          <div className="space-y-6">
            <MarketingSectionHeader
              eyebrow={t("testimonials.badge")}
              title={t("testimonials.title")}
              description={t("testimonials.subtitle")}
              meta={
                <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <span className="text-lg font-black tracking-[-0.05em] text-slate-950">
                    4.8/5
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("testimonials.basedOn")}
                  </span>
                </div>
              }
            />

            <div className="grid gap-3 md:grid-cols-3">
              {overviewCards.map((card) => (
                <MarketingBadgePill
                  key={card.label}
                  label={card.label}
                  sublabel={card.value}
                  tone={card.tone}
                  className="justify-start px-4 py-3"
                />
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {TESTIMONIALS.map((review) => (
                <MarketingQuoteCard
                  key={`${review.name}-${review.city}`}
                  name={review.name}
                  city={review.city}
                  date={review.date}
                  text={review.text}
                  rating={review.rating}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {t("testimonials.basedOn")}
              </p>
              <Link
                href="/soporte#feedback-form"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
              >
                {t("testimonials.shareExperience")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </MarketingSurface>
      </div>
    </section>
  );
}
