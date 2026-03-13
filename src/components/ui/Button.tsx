import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-[var(--accent-strong)] text-white shadow-[0_4px_10px_rgba(0,140,85,0.15)] hover:bg-[var(--accent)] hover:shadow-[0_6px_14px_rgba(0,140,85,0.25)] active:scale-[0.98] hover:-translate-y-0.5",
        secondary:
          "rounded-full bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--border)] active:scale-[0.98]",
        outline:
          "rounded-full border-[1.5px] border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)] active:scale-[0.98]",
        ghost:
          "rounded-full text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        destructive: "rounded-full bg-red-600 text-white hover:bg-red-700",
        success:
          "rounded-full bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]",
      },
      size: {
        default: "h-12 px-7 py-2.5",
        sm: "h-10 px-5 text-xs",
        lg: "h-14 px-9 text-base",
        xl: "h-16 px-12 text-lg",
        icon: "h-12 w-12",
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
  VariantProps<typeof buttonVariants> { }

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
