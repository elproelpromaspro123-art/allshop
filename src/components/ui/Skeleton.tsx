import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "line" | "circle" | "card" | "button" | "image" | "text" | "avatar";
  animation?: "shimmer" | "pulse" | "shimmer_fast" | "none";
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = "line",
    animation = "shimmer",
    ...props 
  }, ref) => {
    const animationClass = {
      shimmer: "animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]",
      pulse: "animate-pulse",
      none: "",
      shimmer_fast: "animate-[skeleton-shimmer_1.2s_ease-in-out_infinite]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-r from-[var(--surface-muted)] via-[var(--border-subtle)] to-[var(--surface-muted)] bg-[length:200%_100%]",
          animationClass[animation as keyof typeof animationClass],
          variant === "circle" && "rounded-full",
          variant === "card" && "rounded-[var(--card-radius)]",
          variant === "button" && "rounded-xl",
          variant === "image" && "rounded-xl",
          variant === "text" && "rounded-lg",
          variant === "avatar" && "rounded-full",
          variant === "line" && "rounded-xl",
          className,
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";
