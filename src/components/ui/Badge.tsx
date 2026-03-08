import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-strong)]/10 text-[var(--accent-strong)] border border-[var(--accent-strong)]/20",
        secondary:
          "bg-[var(--surface-muted)] text-[var(--muted)] border border-[var(--border)]",
        success:
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning:
          "bg-amber-50 text-amber-800 border border-amber-200",
        destructive:
          "bg-red-50 text-red-700 border border-red-200",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5 rounded-full",
        default: "text-xs px-2.5 py-1 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}
Badge.displayName = "Badge";

export { Badge, badgeVariants };
