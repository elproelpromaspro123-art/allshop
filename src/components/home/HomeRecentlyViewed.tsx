"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePricing } from "@/providers/PricingProvider";
import { useRecentlyViewedStore } from "@/store/recently-viewed";

export function HomeRecentlyViewed() {
  const items = useRecentlyViewedStore((store) => store.items);
  const { formatDisplayPrice } = usePricing();

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      data-home-slide=""
      data-density="compact"
      data-tone="base"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="editorial-kicker">
              <Eye className="h-3.5 w-3.5" />
              Seguir donde te quedaste
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
                Vistos recientemente
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                El flujo ya no te obliga a reconstruir tu búsqueda. Tus últimas
                fichas vuelven a aparecer aquí para retomar la compra en segundos.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" size="lg" className="gap-2 px-8">
            <Link href="/#productos">
              Volver al catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <Link
              key={`${item.id}-${item.viewedAt}`}
              href={`/producto/${item.slug}`}
              className="group overflow-hidden rounded-[1.8rem] border border-[rgba(23,19,15,0.08)] bg-white/82 shadow-[0_18px_48px_rgba(23,19,15,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(23,19,15,0.1)]"
            >
              <div className="relative aspect-[1.15] overflow-hidden bg-[linear-gradient(180deg,#f7f2ea,#f3ede4)]">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Eye className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <span>{item.categoryName || "Vortixy"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Reciente
                  </span>
                </div>
                <div>
                  <h3 className="line-clamp-2 text-lg font-black tracking-[-0.04em] text-slate-950">
                    {item.name}
                  </h3>
                  <p suppressHydrationWarning className="mt-2 text-sm font-semibold text-emerald-700">
                    {formatDisplayPrice(item.price)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  Volver a abrir
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
