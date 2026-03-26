"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  MarketingBadgePill,
  MarketingSectionHeader,
  MarketingSignalCard,
  MarketingSurface,
} from "@/components/marketing/MarketingPrimitives";
import { buildTrustSignals } from "@/components/marketing/trust-signals";

interface TrustBarProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "compact";
}

export function TrustBar({
  className,
  variant = "horizontal",
}: TrustBarProps) {
  const { t } = useLanguage();
  const trustItems = buildTrustSignals(t);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2.5 sm:gap-3",
          className,
        )}
      >
        {trustItems.slice(0, 4).map((item) => (
          <MarketingBadgePill
            key={item.title}
            icon={item.Icon}
            label={item.title}
            sublabel={item.description}
            tone={item.tone}
            className="min-w-0 max-w-full"
          />
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item) => (
          <MarketingSignalCard
            key={item.title}
            icon={item.Icon}
            title={item.title}
            description={item.description}
            tone={item.tone}
          />
        ))}
      </div>
    );
  }

  return (
    <MarketingSurface className={cn("px-5 py-5 sm:px-6 sm:py-6", className)}>
      <div className="space-y-5">
        <MarketingSectionHeader
          eyebrow="Respaldo visible"
          title="Todo el soporte de compra queda a la vista."
          description="Antes de confirmar el pedido, el usuario ve garantía, pagos, devoluciones, seguridad y ayuda humana en una sola capa."
          meta={
            <div className="flex flex-wrap gap-2">
              <MarketingBadgePill label="Contra entrega" tone="emerald" />
              <MarketingBadgePill label="Soporte humano" tone="sky" />
              <MarketingBadgePill label="Cambios claros" tone="amber" />
            </div>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {trustItems.map((item) => (
            <MarketingSignalCard
              key={item.title}
              icon={item.Icon}
              title={item.title}
              description={item.description}
              tone={item.tone}
            />
          ))}
        </div>
      </div>
    </MarketingSurface>
  );
}
