import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[#08210f] hover:bg-[var(--accent-strong)] hover:text-white shadow-[0_10px_30px_-18px_rgba(73,204,104,0.75)] active:scale-[0.98]",
        secondary: "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface-muted),var(--accent)_16%)] active:scale-[0.98]",
        outline: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_12%)] active:scale-[0.98]",
        ghost: "text-[var(--muted)] hover:bg-[color-mix(in_oklab,var(--surface-muted),var(--accent)_10%)] hover:text-[var(--foreground)]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
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
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
