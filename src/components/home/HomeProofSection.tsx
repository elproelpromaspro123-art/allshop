"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StorefrontStatsBar } from "@/components/storefront/home/StorefrontStatsBar";
import { StorefrontTrustBar } from "@/components/storefront/commerce/StorefrontTrustBar";

interface HomeProofSectionProps {
  deliveryEstimate: { min: number; max: number } | null;
}

export function HomeProofSection({
  deliveryEstimate,
}: HomeProofSectionProps) {
  const deliveryLine = deliveryEstimate
    ? `${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
    : "3-7 días hábiles";

  return (
    <section
      data-home-slide=""
      data-density="balanced"
      data-tone="base"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="split">
          <div className="v-editorial-copy">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/78 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5" />
              Operación clara
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Una compra seria debe explicarse en una sola mirada.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Entrega, cobertura, devolución y soporte viven en el mismo
                bloque para que no tengas que descifrar la tienda antes de
                confiar.
              </p>
            </div>

            <div className="v-chip-row">
              <div className="v-chip">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span>
                  Entrega visible: <strong>{deliveryLine}</strong>
                </span>
              </div>
              <div className="v-chip">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>
                  Pago: <strong>contra entrega</strong>
                </span>
              </div>
              <div className="v-chip">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>
                  Política: <strong>compra protegida</strong>
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/88 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                  Lectura rápida
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                  Sin promesas vagas ni bloques repetidos.
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Cada panel responde una duda concreta antes de pasar al
                  siguiente.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.18)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-200/78">
                  Conversión
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight">
                  Menos ruido, más claridad para decidir.
                </p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  La home ahora separa prueba, catálogo y soporte como escenas
                  independientes.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
                <Link href="/#productos">
                  Ver productos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full px-8 sm:w-auto"
              >
                <Link href="/faq">Revisar garantías</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <StorefrontStatsBar deliveryEstimate={deliveryEstimate} />
            <StorefrontTrustBar />
          </div>
        </div>
      </div>

      <div className="v-section-divider" />
    </section>
  );
}
