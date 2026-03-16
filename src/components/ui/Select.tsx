"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    
    return (
      <div className="w-full group">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-faint)] z-10">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full h-12 pl-4 pr-11 rounded-xl border-2 text-sm transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-4 focus:ring-opacity-20",
              "hover:border-[var(--border-subtle)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]",
              "appearance-none cursor-pointer",
              icon && "pl-11",
              error
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-400/20"
                : "border-[var(--border)] bg-white focus:border-[var(--secondary)] focus:ring-[var(--secondary-ring)]",
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {children}
          </select>
          {/* Custom chevron */}
          <ChevronDown className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-faint)] pointer-events-none transition-all duration-300",
            "group-focus-within:text-[var(--secondary-strong)]"
          )} />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-2 text-xs text-red-600 flex items-center gap-1.5 animate-fade-in-up">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
