import { cn } from "@/lib/utils";

interface DeliveryLogosProps {
  className?: string;
  variant?: "light" | "dark";
}

export function DeliveryLogos({ className, variant = "dark" }: DeliveryLogosProps) {
  const isLight = variant === "light";
  const textColor = isLight ? "text-white/60" : "text-neutral-400 grayscale";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 sm:gap-6", className)}>
      <span className={cn("text-[11px] font-black tracking-tight", textColor)}>
        SERVIENTREGA
      </span>
      <span className={cn("text-[12px] font-bold italic tracking-tighter", textColor)}>
        INTER
        <span className="font-light">RAPIDÍSIMO</span>
      </span>
      <span className={cn("text-[12px] font-black tracking-widest", textColor)}>
        envía
      </span>
      <span className={cn("text-[10px] font-bold tracking-[0.2em] uppercase", textColor)}>
        Coordinadora
      </span>
    </div>
  );
}
