"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  eyebrow?: ReactNode;
  value: ReactNode;
  actionLabel: ReactNode;
  actionIcon?: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

export function StickyActionBar({
  eyebrow,
  value,
  actionLabel,
  actionIcon,
  onAction,
  disabled,
  className,
  testId,
}: StickyActionBarProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[50] lg:hidden",
        "border-t border-white/10 bg-[rgba(8,19,15,0.88)] text-white backdrop-blur-xl",
        "px-4 py-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(10,15,30,0.16)]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="mb-0.5 text-[10px] font-medium text-emerald-300">{eyebrow}</div>
          ) : null}
          <div className="truncate text-lg font-bold text-white">{value}</div>
        </div>
        <Button
          size="lg"
          className="shrink-0 gap-2 text-sm font-bold shadow-[var(--shadow-action)]"
          onClick={onAction}
          disabled={disabled}
        >
          {actionIcon}
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
