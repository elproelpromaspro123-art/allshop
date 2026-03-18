"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-emerald-500/20 bg-[linear-gradient(135deg,#009e61_0%,#00c879_55%,#00d482_100%)] text-white shadow-[var(--shadow-button)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-button-hover)] active:translate-y-0 active:scale-[0.99]",
        secondary:
          "rounded-full border border-indigo-500/20 bg-[linear-gradient(135deg,#5b5ff0_0%,#6b75ff_100%)] text-white shadow-[0_10px_24px_rgba(79,70,229,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(79,70,229,0.28)] active:translate-y-0 active:scale-[0.99]",
        outline:
          "rounded-full border border-[var(--border)] bg-white/78 text-[var(--foreground)] shadow-[0_8px_24px_rgba(10,15,30,0.06)] hover:-translate-y-0.5 hover:border-black/10 hover:bg-white hover:shadow-[0_12px_30px_rgba(10,15,30,0.09)] active:translate-y-0 active:scale-[0.99]",
        ghost:
          "rounded-full border border-transparent bg-transparent text-[var(--muted)] hover:bg-white/75 hover:text-[var(--foreground)] hover:shadow-[0_10px_24px_rgba(10,15,30,0.06)] active:scale-[0.99]",
        destructive:
          "rounded-full border border-red-500/20 bg-[linear-gradient(135deg,#dc2626_0%,#ef4444_100%)] text-white shadow-[0_10px_24px_rgba(220,38,38,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(220,38,38,0.25)] active:translate-y-0 active:scale-[0.99]",
        success:
          "rounded-full border border-emerald-500/20 bg-[linear-gradient(135deg,#059669_0%,#10b981_100%)] text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(5,150,105,0.25)] active:translate-y-0 active:scale-[0.99]",
        warm:
          "rounded-full border border-amber-400/20 bg-[linear-gradient(135deg,#d97706_0%,#f59e0b_100%)] text-white shadow-[0_10px_24px_rgba(217,119,6,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(217,119,6,0.28)] active:translate-y-0 active:scale-[0.99]",
      },
      size: {
        default: "h-12 px-6 text-sm",
        sm: "h-10 px-[1.125rem] text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg font-bold",
        icon: "h-11 w-11",
        iconSm: "h-9 w-9",
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
  (
    {
      className,
      variant,
      size,
      ripple = true,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    void ripple;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {!loading ? (
          <span className="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)_45%,transparent)] opacity-80 transition-opacity duration-300 group-hover/button:opacity-100" />
        ) : null}

        {loading ? (
          <svg
            className="absolute w-5 h-5 animate-spin text-white/85"
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
        ) : null}

        <span
          className={cn(
            "relative z-10 flex items-center gap-2 transition-transform duration-300 group-hover/button:translate-y-[-1px]",
            loading && "opacity-0"
          )}
        >
          {children}
        </span>

        {loading && loadingText ? (
          <span className="absolute inset-0 z-10 flex items-center justify-center gap-2">
            {loadingText}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
