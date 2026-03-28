"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import {
  MarketingBadgePill,
  MarketingSignalCard,
  MarketingSurface,
} from "@/components/marketing/MarketingPrimitives";
import { buildStorefrontTrustSignals } from "@/components/marketing/trust-signals";

export function StorefrontTrustBar() {
  const { t } = useLanguage();
  const trustItems = buildStorefrontTrustSignals(t);

  return (
    <MarketingSurface className="px-4 py-4 sm:px-5 sm:py-5">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-emerald-700">
              Compra clara
            </p>
            <p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">
              Lo importante, claro desde el inicio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MarketingBadgePill label="Pago al recibir" tone="emerald" />
            <MarketingBadgePill label="Seguimiento disponible" tone="sky" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {trustItems.map((item) => (
            <MarketingSignalCard
              key={item.title}
              icon={item.Icon}
              title={item.title}
              description={item.description}
              tone={item.tone}
              className="min-h-[7.5rem]"
            />
          ))}
        </div>
      </div>
    </MarketingSurface>
  );
}
