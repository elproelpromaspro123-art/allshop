import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: ElementType;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "emerald" | "indigo" | "amber";
  className?: string;
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "bg-gray-100 text-gray-700",
  emerald: "bg-emerald-50 text-emerald-700",
  indigo: "bg-indigo-50 text-indigo-700",
  amber: "bg-amber-50 text-amber-700",
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6",
        "transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {detail ? (
            <p className="text-sm leading-relaxed text-gray-500">{detail}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
