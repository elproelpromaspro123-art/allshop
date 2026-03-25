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
                ? "text-gray-900 mb-1.5"
                : "text-gray-500 mb-2",
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 transition-colors duration-300",
                isFocused && "text-emerald-600",
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
              "w-full h-12 px-4 rounded-[1rem] border text-sm transition-all duration-300 ease-out focus:outline-none",
              "hover:border-slate-300 bg-white/92 focus:bg-white focus:ring-4 focus:ring-emerald-500/12 focus:border-emerald-600 shadow-[0_1px_2px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.7)] focus:shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100",
              icon && "pl-11",
              iconRight && "pr-11",
              error
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20"
                : success
                  ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-gray-200",
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
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
            className="mt-2 text-xs text-gray-400 flex items-center gap-1.5"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
