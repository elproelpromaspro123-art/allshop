"use client";

import { forwardRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, hint, icon, iconRight, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        props.onFocus?.(e);
      },
      [props],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setHasValue(e.target.value.length > 0);
        props.onBlur?.(e);
      },
      [props],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(e.target.value.length > 0);
        props.onChange?.(e);
      },
      [props],
    );

    const inputId = id || props.name;
    const isFloating = isFocused || hasValue || props.type === "date";

    return (
      <div className="w-full group">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium transition-all duration-300",
              isFloating
                ? "text-[var(--foreground)] mb-1.5"
                : "text-[var(--muted)] mb-2",
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-faint)] transition-colors duration-300",
                isFocused && "text-[var(--accent-strong)]",
              )}
            >
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-required={props.required}
            className={cn(
              "w-full h-12 px-4 rounded-[var(--radius-md)] border text-sm transition-all duration-300 ease-out focus:outline-none",
              "hover:border-gray-300 bg-[var(--surface-muted)] focus:bg-white focus:ring-4 focus:ring-[var(--accent)]/15 focus:border-[var(--accent-strong)] shadow-[var(--shadow-inset)] focus:shadow-[var(--shadow-sm)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]",
              icon && "pl-11",
              iconRight && "pr-11",
              error
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20"
                : success
                  ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-[var(--border)]",
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-faint)]">
              {iconRight}
            </div>
          )}
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-scale-in">
              <svg className="w-5 h-5 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-xs text-red-600 flex items-center gap-1.5 animate-fade-in-up"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-2 text-xs text-[var(--muted-soft)] flex items-center gap-1.5"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--secondary)]" />
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
