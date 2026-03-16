"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || props.name;
    
    return (
      <label 
        htmlFor={checkboxId} 
        className="flex items-start gap-3 cursor-pointer group"
      >
        <div className="relative flex items-center shrink-0">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={cn(
              "peer h-5 w-5 rounded-lg border-2 cursor-pointer",
              "transition-all duration-300 ease-out",
              "border-[var(--border)] bg-white",
              "checked:border-[var(--accent-strong)] checked:bg-[var(--accent-strong)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-2",
              "hover:border-[var(--accent-strong)]/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
          <Check
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none scale-50 peer-checked:scale-100"
            strokeWidth="3.5"
          />
        </div>
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm text-[var(--foreground)] font-medium group-hover:text-[var(--accent-strong)] transition-colors">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-[var(--muted-soft)] mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
