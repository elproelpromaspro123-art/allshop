import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center font-semibold whitespace-nowrap transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[var(--accent)]/15 to-[var(--accent-surface)] text-[var(--accent-strong)] border border-[var(--accent-strong)]/20 hover:shadow-md hover:shadow-[var(--accent-glow)]",
        secondary:
          "bg-gradient-to-r from-[var(--secondary-surface)] to-[var(--surface-muted)] text-[var(--secondary-strong)] border border-[var(--secondary)]/20 hover:shadow-md hover:shadow-[var(--secondary-glow)]",
        success:
          "bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 border border-emerald-200/60 hover:shadow-md hover:shadow-emerald-500/10",
        warning:
          "bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-800 border border-amber-200/60 hover:shadow-md hover:shadow-amber-500/10",
        destructive:
          "bg-gradient-to-r from-red-50 to-rose-100/50 text-red-700 border border-red-200/60 hover:shadow-md hover:shadow-red-500/10",
        info:
          "bg-gradient-to-r from-blue-50 to-indigo-100/50 text-blue-700 border border-blue-200/60 hover:shadow-md hover:shadow-blue-500/10",
        outline:
          "bg-transparent text-[var(--foreground)] border-2 border-[var(--border)] hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5 rounded-full gap-1",
        default: "text-xs px-2.5 py-1 rounded-full gap-1.5",
        md: "text-sm px-3 py-1.5 rounded-full gap-2",
        lg: "text-base px-4 py-2 rounded-full gap-2",
      },
      animation: {
        none: "",
        pulse: "animate-subtle-pulse",
        bounce: "animate-bounce-subtle",
        glow: "animate-glow-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, animation, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, animation, className }))} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
Badge.displayName = "Badge";

export { Badge, badgeVariants };
