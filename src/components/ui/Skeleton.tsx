import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "circle" | "card" | "button" | "image" | "text" | "avatar";
  animation?: "shimmer" | "pulse" | "none";
}

export function Skeleton({
  className,
  variant = "line",
  animation = "shimmer",
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-[var(--surface-muted)] via-[var(--border-subtle)] to-[var(--surface-muted)] bg-[length:200%_100%]",
        animation === "shimmer" &&
          "animate-[skeleton-shimmer_2s_infinite_ease-in-out]",
        animation === "pulse" && "animate-pulse",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-[var(--card-radius)]",
        variant === "button" && "rounded-xl",
        variant === "image" && "rounded-xl",
        variant === "text" && "rounded-lg",
        variant === "avatar" && "rounded-full",
        variant === "line" && "rounded-xl",
        className,
      )}
    />
  );
}
