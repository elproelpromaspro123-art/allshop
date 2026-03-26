"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WishlistOverviewProps {
  itemCount: number;
  categoryCount: number;
  totalValueLabel: string;
  latestSavedLabel: string;
  onClear: () => void;
}

export function WishlistOverview({
  itemCount,
  categoryCount,
  totalValueLabel,
  latestSavedLabel,
  onClear,
}: WishlistOverviewProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[rgba(23,19,15,0.08)] bg-white shadow-[0_18px_48px_rgba(23,19,15,0.06)]">
      <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
          <div className="editorial-kicker">
            <Heart className="h-3.5 w-3.5" />
            Favoritos guardados
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-[-0.05em] text-slate-950 sm:text-3xl">
              Tu shortlist comercial en Vortixy
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Retoma productos guardados, revisa el valor estimado y vuelve al
              producto correcto sin reconstruir la busqueda desde cero.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/#productos">
                Explorar catalogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4" />
              Limpiar lista
            </Button>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            La lista vive en este navegador y se recupera al volver a entrar.
          </p>
        </div>

        <div className="border-t border-[rgba(23,19,15,0.08)] bg-[linear-gradient(180deg,#f8f6f1,#efe8dc)] px-6 py-8 sm:px-8 lg:border-l lg:border-t-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_12px_30px_rgba(23,19,15,0.08)]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                <span>Guardados</span>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-4 text-3xl font-black tracking-[-0.06em] text-slate-950">
                {itemCount}
              </div>
              <p className="mt-1 text-sm text-slate-500">Productos en favoritos</p>
            </div>

            <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_12px_30px_rgba(23,19,15,0.08)]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                <span>Categorias</span>
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-4 text-3xl font-black tracking-[-0.06em] text-slate-950">
                {categoryCount}
              </div>
              <p className="mt-1 text-sm text-slate-500">Frentes de compra activos</p>
            </div>

            <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_12px_30px_rgba(23,19,15,0.08)]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                <span>Valor estimado</span>
                <Tag className="h-4 w-4 text-amber-600" />
              </div>
              <div suppressHydrationWarning className="mt-4 text-3xl font-black tracking-[-0.06em] text-slate-950">
                {totalValueLabel}
              </div>
              <p className="mt-1 text-sm text-slate-500">Suma de los favoritos guardados</p>
            </div>

            <div className="rounded-[1.4rem] border border-white/70 bg-white/88 p-4 shadow-[0_12px_30px_rgba(23,19,15,0.08)]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                <span>Ultimo guardado</span>
                <CalendarDays className="h-4 w-4 text-slate-700" />
              </div>
              <div className="mt-4 text-2xl font-black tracking-[-0.05em] text-slate-950">
                {latestSavedLabel}
              </div>
              <p className="mt-1 text-sm text-slate-500">La lista siempre mantiene contexto</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
