import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveDisclosureSectionProps {
  id?: string;
  badge?: ReactNode;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function ResponsiveDisclosureSection({
  id,
  badge,
  title,
  description,
  defaultOpen = false,
  className,
  children,
}: ResponsiveDisclosureSectionProps) {
  return (
    <div id={id}>
      <div className={cn("hidden lg:block", className)}>{children}</div>
      <details className={cn("detail-disclosure lg:hidden", className)} open={defaultOpen}>
        <summary className="detail-disclosure__summary">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-2">
              {badge ? <div>{badge}</div> : null}
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              {description ? (
                <p className="text-sm leading-6 text-gray-500">{description}</p>
              ) : null}
            </div>
            <ChevronDown className="detail-disclosure__icon mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
          </div>
        </summary>
        <div className="detail-disclosure__content">{children}</div>
      </details>
    </div>
  );
}
