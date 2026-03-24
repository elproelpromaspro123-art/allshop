import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  eyebrow?: ReactNode;
  value: ReactNode;
  supportingText?: ReactNode;
  actionLabel: ReactNode;
  actionIcon?: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
  actionTestId?: string;
  secondaryAction?: {
    label: ReactNode;
    icon?: ReactNode;
    onAction: () => void;
    disabled?: boolean;
    variant?: ButtonProps["variant"];
    testId?: string;
  };
}

export function StickyActionBar({
  eyebrow,
  value,
  supportingText,
  actionLabel,
  actionIcon,
  onAction,
  disabled,
  className,
  testId,
  actionTestId,
  secondaryAction,
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
          {supportingText ? (
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">
              {supportingText}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {secondaryAction ? (
            <Button
              size="sm"
              variant={secondaryAction.variant ?? "outline"}
              className="gap-2 border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
              onClick={secondaryAction.onAction}
              disabled={secondaryAction.disabled}
              data-testid={secondaryAction.testId}
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          ) : null}
          <Button
            size="lg"
            className="shrink-0 gap-2 text-sm font-bold shadow-[var(--shadow-action)]"
            onClick={onAction}
            disabled={disabled}
            data-testid={actionTestId}
          >
            {actionIcon}
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
