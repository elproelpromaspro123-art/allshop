"use client";

import { Children, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button-variants";

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
      ripple: _ripple = true,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
    ) => {
    void _ripple;
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
              aria-hidden="true"
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
