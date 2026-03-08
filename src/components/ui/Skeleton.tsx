import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "circle" | "card";
}

export function Skeleton({ className, variant = "line" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--surface-muted)]",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-2xl",
        variant === "line" && "rounded-xl",
        className,
      )}
    />
  );
}
