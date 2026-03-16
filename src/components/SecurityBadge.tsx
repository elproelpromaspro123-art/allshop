"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface SecurityBadgeProps {
  className?: string;
}

export function SecurityBadge({ className }: SecurityBadgeProps) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 text-emerald-800",
        className
      )}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span>
        {t("security.label")}{" "}
        <span className="font-bold text-emerald-700">{t("security.ssl")}</span>
      </span>
    </div>
  );
}
