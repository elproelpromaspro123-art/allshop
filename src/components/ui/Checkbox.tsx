"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || props.name;
    return (
      <label htmlFor={checkboxId} className="flex items-start gap-2.5 cursor-pointer">
        <input
          id={checkboxId}
          ref={ref}
          type="checkbox"
          className={cn(
            "mt-1 h-4 w-4 accent-[var(--accent-strong)] cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <span className={cn("text-sm", "text-neutral-700")}>{label}</span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
