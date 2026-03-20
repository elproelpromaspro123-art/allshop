"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";

export function HomeCTA() {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-[var(--background)] relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--emerald-panel-strong)_0%,var(--emerald-panel-mid)_55%,var(--emerald-panel-soft)_100%)] px-5 py-5 shadow-[var(--shadow-cta)] transition-shadow duration-500 hover:shadow-[var(--shadow-cta-hover)] surface-ambient brand-v-slash sm:px-8 sm:py-6 lg:px-10 lg:py-7">
          <div className="absolute -right-10 top-[-1.5rem] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,212,130,0.12)_0%,transparent_72%)] pointer-events-none sm:h-44 sm:w-44" />
          <div className="absolute -left-8 bottom-[-2rem] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(0,168,104,0.08)_0%,transparent_72%)] pointer-events-none sm:h-36 sm:w-36" />

          <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/76">
                  Contraentrega
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/80">
                  Sin anticipos
                </span>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                {t("cta.noRisk.badge")}
              </p>
              <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t("cta.noRisk.title")}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                {t("cta.noRisk.text")}
              </p>
            </div>

            <div className="w-full shrink-0 lg:w-auto lg:justify-self-end">
              <Link href="#productos" className="block w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 border-0 bg-white text-[#052e1a] shadow-[var(--shadow-elevated)] hover:bg-emerald-50 lg:w-auto"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {t("cta.noRisk.button")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
