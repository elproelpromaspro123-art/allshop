import { cn } from "@/lib/utils";

interface DeliveryLogosProps {
  className?: string;
  variant?: "light" | "dark";
}

const CARRIERS = [
  { name: "SERVIENTREGA", className: "text-[11px] font-black tracking-tight" },
  { name: "INTER", suffix: "RAPIDISIMO", suffixClass: "font-light", className: "text-[12px] font-bold italic tracking-tighter" },
  { name: "envia", className: "text-[12px] font-black tracking-widest" },
  { name: "Coordinadora", className: "text-[10px] font-bold tracking-[0.2em] uppercase" },
];

export function DeliveryLogos({ className, variant = "dark" }: DeliveryLogosProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3 sm:gap-4", className)}>
      {CARRIERS.map((carrier) => (
        <span
          key={carrier.name}
          className={cn(
            "px-3 py-1.5 rounded-lg border transition-all duration-300",
            isLight
              ? "border-white/15 text-white/50 hover:text-white/80 hover:border-white/30"
              : "border-[var(--border)] text-[var(--muted-faint)] hover:text-[var(--muted)] hover:border-[var(--border-subtle)] hover:shadow-sm",
            carrier.className
          )}
        >
          {carrier.name}
          {carrier.suffix && <span className={carrier.suffixClass}>{carrier.suffix}</span>}
        </span>
      ))}
    </div>
  );
}

