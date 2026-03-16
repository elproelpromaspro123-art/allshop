"use client";

import { forwardRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--accent)] text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] hover:from-[var(--accent)] hover:to-[var(--accent-bright)] active:shadow-[var(--shadow-button-press)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        secondary:
          "rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-strong)] text-white shadow-md hover:shadow-lg hover:from-[var(--secondary-strong)] hover:to-[var(--secondary)] active:scale-[0.98] hover:-translate-y-0.5",
        outline:
          "rounded-full border-2 border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)] hover:shadow-md active:scale-[0.98] hover:-translate-y-0.5",
        ghost:
          "rounded-full text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] hover:shadow-sm active:scale-[0.98]",
        destructive: 
          "rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-lg hover:from-red-700 hover:to-red-600 active:scale-[0.98] hover:-translate-y-0.5",
        success:
          "rounded-full bg-gradient-to-r from-[var(--success)] to-emerald-500 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-500 active:scale-[0.98] hover:-translate-y-0.5",
        warm:
          "rounded-full bg-gradient-to-r from-[var(--warm)] to-[var(--warm-bright)] text-white shadow-md hover:shadow-lg hover:from-[var(--warm-bright)] hover:to-amber-400 active:scale-[0.98] hover:-translate-y-0.5",
      },
      size: {
        default: "h-12 px-7 py-2.5 text-sm",
        sm: "h-10 px-5 text-xs",
        lg: "h-14 px-9 text-base",
        xl: "h-16 px-12 text-lg font-bold",
        icon: "h-12 w-12",
        iconSm: "h-10 w-10",
        iconLg: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  ripple?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ripple = true, loading = false, loadingText, children, onClick, disabled, ...props }, ref) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

    const createRipple = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ripple || loading) return;

        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        setRipples((prev) => [...prev, { x, y, id }]);

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);

        onClick?.(e);
      },
      [onClick, ripple, loading]
    );

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={createRipple}
        disabled={disabled || loading}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full bg-white/30 animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: "100px",
              height: "100px",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Shine effect on hover */}
        {!loading && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out" />
        )}

        {/* Loading spinner */}
        {loading && (
          <svg
            className="absolute w-5 h-5 animate-spin text-white/80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Children */}
        <span className={cn(
          "relative z-10 flex items-center gap-2",
          loading && "opacity-0"
        )}>
          {children}
        </span>

        {/* Loading text */}
        {loading && loadingText && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 z-10">
            {loadingText}
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
