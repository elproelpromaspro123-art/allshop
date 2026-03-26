"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const initials = fallback?.slice(0, 2).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center font-medium text-gray-600",
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt || ""} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
