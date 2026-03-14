import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "circle" | "card";
}

export function Skeleton({ className, variant = "line" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-[skeleton-shimmer_1.5s_infinite_ease-in-out] bg-[length:200%_100%] bg-gradient-to-r from-[var(--surface-muted)] via-[var(--border)] to-[var(--surface-muted)]",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-[var(--card-radius)]",
        variant === "line" && "rounded-xl",
        className,
      )}
    />
  );
}
