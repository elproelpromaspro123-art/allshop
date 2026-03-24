"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

export function StorefrontHero() {
  const { t } = useLanguage();

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#f0faf5] via-white to-[#f0f0ff] pt-8 pb-16 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-32"
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Envío a toda Colombia
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Tu tienda online{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              con pago al recibir
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-500 sm:mt-6 sm:text-lg">
            Compra desde cualquier ciudad de Colombia. Recibes primero, pagas después. Sin tarjetas, sin complicaciones.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
              <Link href="/#productos">
                {t("hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full gap-2 px-8 sm:w-auto">
              <Link href="/seguimiento">
                Rastrear mi pedido
              </Link>
            </Button>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              Envío nacional
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Contra entrega
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Compra segura
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
