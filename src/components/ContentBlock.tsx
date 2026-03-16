import type { ReactNode } from "react";

interface ContentBlockProps {
  title: string;
  children: ReactNode;
  variant?: "default" | "highlight";
}

export function ContentBlock({ title, children, variant = "default" }: ContentBlockProps) {
  return (
    <div
      className={`rounded-xl p-5 ${
        variant === "highlight"
          ? "bg-[var(--surface-muted)] border border-[var(--border)]"
          : ""
      }`}
    >
      <h2 className="text-base font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-3">
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
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-sm">
          {variant === "check" ? (
            <span className="w-5 h-5 rounded-full bg-[var(--accent-surface)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-[var(--accent-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-2" />
          )}
          <span className="text-[var(--muted)]">{item}</span>
        </li>
      ))}
    </ul>
  );
}
