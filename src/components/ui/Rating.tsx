"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  onChange?: (value: number) => void;
}

const sizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };

export function Rating({ value, max = 5, size = "md", showValue, onChange }: RatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i + 1)}
          aria-label={`Calificar ${i + 1} de ${max} estrellas`}
          className={cn("text-amber-400", !onChange && "cursor-default")}
        >
          <Star className={cn(sizes[size], i < value && "fill-current")} />
        </button>
      ))}
      {showValue && <span className="ml-1 text-sm text-gray-600">{value.toFixed(1)}</span>}
    </div>
  );
}
