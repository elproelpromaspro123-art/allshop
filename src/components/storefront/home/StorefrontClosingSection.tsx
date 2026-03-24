"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StorefrontClosingSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 py-16 sm:py-20">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          ¿Listo para hacer tu pedido?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-emerald-100/80 sm:text-lg">
          Elige lo que necesitas, nosotros lo llevamos hasta tu puerta. Pagas cuando recibes.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            asChild
            size="lg"
            className="w-full gap-2 border-white/20 bg-white px-8 text-emerald-700 shadow-lg hover:bg-emerald-50 sm:w-auto"
          >
            <Link href="/#productos">
              Ver productos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full gap-2 border-white/30 px-8 text-white hover:bg-white/10 sm:w-auto"
          >
            <Link href="/soporte">
              <MessageCircle className="h-4 w-4" />
              Hablar con soporte
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
