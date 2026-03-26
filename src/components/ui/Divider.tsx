"use client";

import { cn } from "@/lib/utils";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Divider({ orientation = "horizontal", className }: DividerProps) {
  return (
    <div
      className={cn(
        "bg-gray-200",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className,
      )}
    />
  );
}
