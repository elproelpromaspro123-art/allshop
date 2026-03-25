import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

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
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
        variant === "highlight"
          ? "border-emerald-200/60 bg-emerald-50/40"
          : "border-gray-100 bg-white"
      }`}
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-[15px]">
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
          className="flex items-start gap-3 text-sm sm:text-[15px]"
        >
          {variant === "check" ? (
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
            </span>
          ) : (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          )}
          <span className="text-gray-600">{item}</span>
        </li>
      ))}
    </ul>
  );
}
