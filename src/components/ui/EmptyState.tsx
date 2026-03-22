"use client";

import type { ElementType, ReactNode } from "react";

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="panel-surface px-6 py-8 text-center sm:px-8 sm:py-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent-strong)]">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
