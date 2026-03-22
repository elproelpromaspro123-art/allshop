"use client";

import { Children, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-emerald-500/22 bg-[linear-gradient(135deg,#0e8f61_0%,#10b981_52%,#34d399_100%)] text-white shadow-[0_14px_34px_rgba(5,150,105,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(5,150,105,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-emerald-500/25",
        secondary:
          "rounded-full border border-indigo-500/18 bg-[linear-gradient(135deg,#4f46e5_0%,#6366f1_55%,#818cf8_100%)] text-white shadow-[0_14px_34px_rgba(79,70,229,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(79,70,229,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-indigo-500/25",
        outline:
          "rounded-full border border-[var(--border)] bg-white/88 text-[var(--foreground)] shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-black/12 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-black/10",
        ghost:
          "rounded-full border border-transparent bg-transparent text-[var(--muted)] hover:bg-white/82 hover:text-[var(--foreground)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)] active:scale-[0.99] focus-visible:ring-gray-400/20",
        destructive:
          "rounded-full border border-red-500/20 bg-[linear-gradient(135deg,#dc2626_0%,#ef4444_100%)] text-white shadow-[0_10px_24px_rgba(220,38,38,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(220,38,38,0.25)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-red-500",
        success:
          "rounded-full border border-emerald-500/20 bg-[linear-gradient(135deg,#059669_0%,#10b981_100%)] text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(5,150,105,0.25)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-emerald-500",
        warm: "rounded-full border border-amber-400/20 bg-[linear-gradient(135deg,#d97706_0%,#f59e0b_100%)] text-white shadow-[0_10px_24px_rgba(217,119,6,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(217,119,6,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-amber-500",
        soft: "rounded-full border border-[var(--accent)]/12 bg-[var(--accent-surface)] text-[var(--accent-strong)] shadow-[0_10px_28px_rgba(16,185,129,0.08)] hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/20 active:scale-[0.99] focus-visible:ring-[var(--accent)]/20",
        link: "rounded-none border-none bg-transparent text-[var(--accent-strong)] underline-offset-4 hover:underline hover:text-[var(--accent-dim)] p-0 h-auto focus-visible:ring-[var(--accent)]",
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
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
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
      asChild = false,
      ripple = true,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    void ripple;
    const child = asChild ? Children.only(children) : null;
    const childProps = isValidElement(child)
      ? (child.props as React.HTMLAttributes<HTMLElement> & {
          children?: React.ReactNode;
          className?: string;
        })
      : null;
    const contentChildren = asChild ? childProps?.children : children;
    const resolvedClassName = cn(
      buttonVariants({ variant, size, className }),
      asChild && (disabled || loading) && "pointer-events-none opacity-50",
    );
    const content = (
      <>
        {!loading && variant !== "ghost" && variant !== "link" ? (
          <span className="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)_42%,transparent)] opacity-90 transition-opacity duration-300 group-hover/button:opacity-100" />
        ) : null}

        {loading ? (
          <>
            <svg
              className="absolute w-5 h-5 animate-spin text-current opacity-100"
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
            <span className="absolute inset-0 rounded-full opacity-0 bg-black/10 transition-opacity duration-300 group-hover/button:opacity-5" />
          </>
        ) : null}

        <span
          className={cn(
            "relative z-10 flex items-center gap-2 transition-transform duration-300 group-hover/button:translate-y-[-1px]",
            loading && "opacity-0",
          )}
        >
          {contentChildren}
        </span>

        {loading && loadingText ? (
          <span className="absolute inset-0 z-10 flex items-center justify-center gap-2">
            {loadingText}
          </span>
        ) : null}
      </>
    );

    if (asChild) {
      if (!isValidElement(child)) return null;
      const resolvedChildProps = child.props as React.HTMLAttributes<HTMLElement> & {
        children?: React.ReactNode;
        className?: string;
      };

      const mergedProps = {
        ...props,
        className: cn(resolvedClassName, resolvedChildProps.className),
        "aria-disabled":
          disabled || loading ? true : resolvedChildProps["aria-disabled"],
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          if (disabled || loading) {
            event.preventDefault();
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (resolvedChildProps.onClick as any)?.(event);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!event.defaultPrevented) (props.onClick as any)?.(event);
        },
        tabIndex: disabled || loading ? -1 : resolvedChildProps.tabIndex,
      };

      return cloneElement(child, mergedProps, content);
    }

    return (
      <button
        className={resolvedClassName}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
