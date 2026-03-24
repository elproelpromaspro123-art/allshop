import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          {eyebrow ? <p className="page-header-kicker">{eyebrow}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-headline text-[var(--foreground)]">{title}</h1>
            {badge}
          </div>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="panel-toolbar">{actions}</div> : null}
      </div>
    </div>
  );
}
