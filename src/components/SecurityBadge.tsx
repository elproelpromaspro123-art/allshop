import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityBadgeProps {
  className?: string;
}

export function SecurityBadge({ className }: SecurityBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]",
        className
      )}
    >
      <Lock className="w-3 h-3 text-[var(--accent-strong)]" />
      <span>
        Sitio seguro{" "}
        <span className="text-[var(--accent-strong)] font-semibold">SSL</span>
      </span>
    </div>
  );
}
