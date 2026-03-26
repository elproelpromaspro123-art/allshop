"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingBadgePill } from "@/components/marketing/MarketingPrimitives";
import { useLanguage } from "@/providers/LanguageProvider";

interface SecurityBadgeProps {
  className?: string;
}

export function SecurityBadge({ className }: SecurityBadgeProps) {
  const { t } = useLanguage();

  return (
    <MarketingBadgePill
      icon={ShieldCheck}
      label={t("security.label")}
      sublabel={t("security.ssl")}
      tone="emerald"
      className={cn("whitespace-nowrap px-3.5 py-1.5", className)}
    />
  );
}
