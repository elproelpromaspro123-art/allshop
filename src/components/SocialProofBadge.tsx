"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface SocialProofBadgeProps {
  className?: string;
}

function getInitialColor(name: string): string {
  const colors = ["bg-emerald-200", "bg-amber-200", "bg-indigo-200"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const AVATAR_INITIALS = ["C", "A", "L"];
const AVATAR_NAMES = ["Carolina", "Andres", "Luisa"];

export function SocialProofBadge({ className }: SocialProofBadgeProps) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-white px-4 py-2 shadow-sm animate-fade-in-up",
        className
      )}
    >
      <div className="flex -space-x-1.5">
        {AVATAR_INITIALS.map((initial, i) => (
          <div
            key={initial}
            className={cn(
              "w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold",
              getInitialColor(AVATAR_NAMES[i])
            )}
          >
            {initial}
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-[var(--foreground)] leading-tight">
          {t("socialProof.delivered")}
        </span>
        <span className="text-[10px] text-[var(--muted)] leading-tight">
          {t("socialProof.realClients")}
        </span>
      </div>
    </div>
  );
}
