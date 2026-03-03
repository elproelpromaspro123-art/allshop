import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-[var(--accent)] text-[#071a0a] hover:brightness-110 active:scale-[0.97]",
        secondary:
          "rounded-full bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--border)] active:scale-[0.97]",
        outline:
          "rounded-full border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)] active:scale-[0.97]",
        ghost:
          "rounded-xl text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        destructive: "rounded-full bg-red-600 text-white hover:bg-red-700",
        success:
          "rounded-full bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base",
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
