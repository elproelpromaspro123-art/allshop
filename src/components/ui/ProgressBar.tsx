"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  default: {
    track: "bg-emerald-500/20",
    fill: "bg-emerald-500",
  },
  success: {
    track: "bg-green-500/20",
    fill: "bg-green-500",
  },
  warning: {
    track: "bg-amber-500/20",
    fill: "bg-amber-500",
  },
  danger: {
    track: "bg-red-500/20",
    fill: "bg-red-500",
  },
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const variantStyle = variantClasses[variant];

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-900">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full",
          sizeClasses[size],
          variantStyle.track,
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantStyle.fill,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
