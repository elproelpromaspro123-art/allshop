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
          ? "rounded-2xl bg-gray-900 text-white"
          : "rounded-2xl border border-gray-100 bg-white shadow-sm",
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
              : "bg-emerald-50 text-emerald-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="grid gap-2">
          <p className={cn("text-base font-semibold", dark ? "text-white" : "text-gray-900")}>
            {title}
          </p>
          <p className={cn("text-sm leading-relaxed", dark ? "text-white/72" : "text-gray-500")}>
            {description}
          </p>
        </div>
        {action ? <div className="flex items-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}
