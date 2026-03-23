import type { ReactNode } from "react";

interface ContentBlockProps {
  title: string;
  children: ReactNode;
  variant?: "default" | "highlight";
}

export function ContentBlock({
  title,
  children,
  variant = "default",
}: ContentBlockProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-xl)] border p-4 sm:p-6 lg:p-7 shadow-[var(--shadow-card)] ${
        variant === "highlight"
          ? "border-[var(--accent)]/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.96))]"
          : "border-[var(--border-subtle)] bg-white/92"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--foreground)] sm:mb-4 sm:text-lg">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-surface)] text-[var(--accent-strong)] shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
        {children}
      </div>
    </div>
  );
}

interface ContentListProps {
  items: string[];
  variant?: "check" | "dot";
}

export function ContentList({ items, variant = "check" }: ContentListProps) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3.5 text-sm sm:text-[15px]"
        >
          {variant === "check" ? (
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--accent)]/25 bg-[var(--accent-surface)] shrink-0">
              <svg
                className="w-3 h-3 text-[var(--accent-strong)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          ) : (
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          )}
          <span className="text-[var(--muted)]">{item}</span>
        </li>
      ))}
    </ul>
  );
}
