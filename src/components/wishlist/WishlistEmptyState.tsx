"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WishlistEmptyState() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[rgba(23,19,15,0.08)] bg-white shadow-[0_18px_48px_rgba(23,19,15,0.06)]">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
          <div className="editorial-kicker">
            <Heart className="h-3.5 w-3.5" />
            Lista vacía
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-3xl">
              Todavía no hay favoritos guardados
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Guarda productos desde el catálogo o desde la ficha del producto para
              volver a ellos después, comparar opciones y decidir con más calma.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/#productos">
                Explorar catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/">
                Volver al inicio
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Tu shortlist se guarda en este navegador y vuelve cuando regreses.
          </p>
        </div>

        <div className="border-t border-[rgba(23,19,15,0.08)] bg-[linear-gradient(180deg,#f8f6f1,#efe8dc)] px-6 py-8 sm:px-8 lg:border-l lg:border-t-0">
          <div className="rounded-[1.6rem] border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(23,19,15,0.08)]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              Cómo usar favoritos
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
                <div className="text-sm font-semibold">1. Guarda</div>
                <p className="mt-1 text-sm text-white/70">
                  Marca los productos que te interesan desde el catálogo o la PDP.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="text-sm font-semibold text-slate-950">2. Compara</div>
                <p className="mt-1 text-sm text-slate-600">
                  Revisa precio, categoría y contexto comercial sin perder el hilo.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="text-sm font-semibold text-emerald-900">3. Retoma</div>
                <p className="mt-1 text-sm text-emerald-800">
                  Vuelve al producto correcto sin reconstruir la búsqueda desde cero.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
