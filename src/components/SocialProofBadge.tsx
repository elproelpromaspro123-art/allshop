"use client";

import { BadgeCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialProofBadgeProps {
  className?: string;
}

export function SocialProofBadge({ className }: SocialProofBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-white px-4 py-2 shadow-sm animate-fade-in-up",
        className
      )}
    >
      <div className="flex -space-x-1.5">
        <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
          <Users className="w-3 h-3 text-emerald-700" />
        </div>
        <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center">
          <BadgeCheck className="w-3 h-3 text-amber-700" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-[var(--foreground)] leading-tight">
          +2.500 pedidos entregados
        </span>
        <span className="text-[10px] text-[var(--muted)] leading-tight">
          Clientes reales en toda Colombia
        </span>
      </div>
    </div>
  );
}
