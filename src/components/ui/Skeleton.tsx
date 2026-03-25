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
          "bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]",
          animationClass[animation as keyof typeof animationClass],
          variant === "circle" && "rounded-full",
          variant === "card" && "rounded-2xl",
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
