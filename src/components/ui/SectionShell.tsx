"use client";

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
    <section className={cn("section-shell", className)}>
      <div className="section-shell__inner">
        {eyebrow || title || description || actions ? (
          <div className={cn("grid gap-3", headerClassName)}>
            {eyebrow ? <p className="page-header-kicker">{eyebrow}</p> : null}
            {title ? (
              <h2 className="text-title-lg text-[var(--foreground)]">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-7 text-[var(--muted)]">{description}</p>
            ) : null}
            {actions ? <div className="panel-toolbar">{actions}</div> : null}
          </div>
        ) : null}
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
