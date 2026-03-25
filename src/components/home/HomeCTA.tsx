"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

const testimonials = [
  {
    name: "Carolina M.",
    city: "Medellín",
    text: "Pedí un viernes y el martes ya lo tenía. Todo bien empacado y el producto igual a las fotos.",
    rating: 5,
  },
  {
    name: "Andrés F.",
    city: "Bucaramanga",
    text: "Tenía dudas sobre la talla y me respondieron por WhatsApp en minutos. Al final quedó perfecto.",
    rating: 5,
  },
  {
    name: "Laura P.",
    city: "Cali",
    text: "Es mi segunda compra. El pago contra entrega me da tranquilidad porque no me gusta dar datos de tarjeta.",
    rating: 5,
  },
];

export function HomeCTA() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Testimonials */}
        <div className="mb-14">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Opiniones reales
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Lo que dicen nuestros clientes
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < t.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 text-sm font-bold text-emerald-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 p-8 text-center shadow-xl sm:p-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Todo listo para tu pedido
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-300">
            Elige lo que necesitas y nosotros lo llevamos a tu puerta. Pagas al recibir.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
              <Link href="/#productos">
                Ver productos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
