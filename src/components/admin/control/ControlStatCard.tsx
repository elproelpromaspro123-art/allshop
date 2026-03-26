import { cn } from "@/lib/utils";

interface ControlStatCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "emerald" | "amber" | "rose" | "indigo";
}

const TONE_CLASSES: Record<NonNullable<ControlStatCardProps["tone"]>, string> = {
  default: "border-gray-200 bg-white text-gray-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

export function ControlStatCard({
  label,
  value,
  detail,
  tone = "default",
}: ControlStatCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
        TONE_CLASSES[tone],
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-current/65">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      {detail ? (
        <p className="mt-1 text-sm leading-relaxed text-current/70">{detail}</p>
      ) : null}
    </article>
  );
}
