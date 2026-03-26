import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
  disabled?: boolean;
}

interface ControlEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
  className?: string;
}

export function ControlEmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className,
}: ControlEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-gray-200 bg-white/90 p-6 text-center shadow-sm",
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-500">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-bold tracking-tight text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {primaryAction ? (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              variant={secondaryAction.variant || "outline"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
