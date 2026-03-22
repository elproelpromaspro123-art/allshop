"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "default" | "dark";
  className?: string;
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: ActionCardProps) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        dark
          ? "surface-panel-dark surface-ambient brand-v-slash text-white"
          : "panel-surface",
        "px-5 py-5 sm:px-6",
        className,
      )}
    >
      <div className="relative z-[1] grid gap-4">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            dark
              ? "border border-white/12 bg-white/10 text-emerald-200"
              : "bg-[var(--surface-muted)] text-[var(--accent-strong)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="grid gap-2">
          <p className={cn("text-base font-semibold", dark ? "text-white" : "text-[var(--foreground)]")}>
            {title}
          </p>
          <p className={cn("text-sm leading-7", dark ? "text-white/72" : "text-[var(--muted)]")}>
            {description}
          </p>
        </div>
        {action ? <div className="panel-toolbar">{action}</div> : null}
      </div>
    </div>
  );
}
