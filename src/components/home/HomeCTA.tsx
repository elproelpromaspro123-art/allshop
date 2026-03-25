"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

const testimonials = [
  {
    name: "Carolina M.",
    city: "Medellín",
    text: "Pedí un viernes y el martes ya lo tenía. Todo llegó exactamente como en la foto.",
    rating: 5,
  },
  {
    name: "Andrés F.",
    city: "Bucaramanga",
    text: "Me respondieron por WhatsApp en minutos. Eso me dio la confianza para comprar.",
    rating: 5,
  },
  {
    name: "Laura P.",
    city: "Cali",
    text: "Me encantó que pude pagar cuando me llegó el pedido. Cero riesgo, todo claro.",
    rating: 5,
  },
];

export function HomeCTA() {
  return (
    <section
      data-home-slide=""
      data-density="balanced"
      data-tone="mist"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="split">
          <div className="v-editorial-copy">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              Opiniones reales
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Lo que dicen quienes ya compraron
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Clientes de toda Colombia comparten su experiencia.
                Pedidos entregados, soporte real y cero complicaciones.
              </p>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-7 text-white shadow-[0_26px_80px_rgba(2,6,23,0.22)] sm:p-8">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-emerald-200/76">
                ¿Listo para ordenar?
              </p>
              <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                Elegí tu producto y pagá al recibir.
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/76 sm:text-base">
                Sin tarjetas, sin anticipos. Elegís, pedís y cuando llegue a tu puerta pagás en efectivo.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
                  <Link href="/#productos">
                    Ver productos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="w-full gap-2 border-white/25 bg-white/15 px-8 text-white backdrop-blur-sm hover:bg-white/25 sm:w-auto"
                >
                  <Link href="/soporte">
                    <MessageCircle className="h-4 w-4" />
                    Hablar con soporte
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-[1.7rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.06)] sm:p-6"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < testimonial.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 text-sm font-black text-emerald-700">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {testimonial.name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {testimonial.city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
