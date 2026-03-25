"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

export function StorefrontHero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f0fdf6] via-white to-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-200/25 blur-[100px]" />
        <div className="absolute top-1/3 -left-20 h-[400px] w-[400px] rounded-full bg-indigo-100/20 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-emerald-100/15 blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:px-8 lg:pb-32 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-200/60 bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Envío a toda Colombia · Pago al recibir
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
            Tu tienda online con{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              pago contra entrega
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Compra desde cualquier ciudad del país. Recibes primero, pagas después.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
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
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Truck className="h-4 w-4 text-emerald-600" />
              </span>
              Envío nacional
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <CreditCard className="h-4 w-4 text-emerald-600" />
              </span>
              Contra entrega
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </span>
              Compra protegida
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
