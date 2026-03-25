import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionShellProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function SectionShell({
  eyebrow,
  title,
  description,
  actions,
  className,
  headerClassName,
  contentClassName,
  children,
}: SectionShellProps) {
  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {eyebrow || title || description || actions ? (
          <div className={cn("grid gap-3 mb-8", headerClassName)}>
            {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">{eyebrow}</p> : null}
            {title ? (
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-relaxed text-gray-500">{description}</p>
            ) : null}
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </div>
        ) : null}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
