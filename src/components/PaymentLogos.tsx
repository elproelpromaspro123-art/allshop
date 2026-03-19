import { cn } from "@/lib/utils";

interface PaymentLogosProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

interface BrandBadge {
  name: string;
  label: string;
  tone: string;
  width: string;
}

const BRAND_BADGES: BrandBadge[] = [
  {
    name: "Contraentrega",
    label: "Contra entrega",
    tone: "text-[#166534]",
    width: "w-[7.4rem]",
  },
  {
    name: "Pago al recibir",
    label: "Pago al recibir",
    tone: "text-[#0f766e]",
    width: "w-[7.8rem]",
  },
  {
    name: "Verificacion",
    label: "Verificacion de pedido",
    tone: "text-[#1d4ed8]",
    width: "w-[9.6rem]",
  },
  {
    name: "Cobertura",
    label: "Cobertura nacional",
    tone: "text-[#854d0e]",
    width: "w-[8.2rem]",
  },
];

export function PaymentLogos({
  className,
  variant = "dark",
  size = "sm",
}: PaymentLogosProps) {
  const boxHeight = size === "sm" ? "h-7" : "h-9";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const cardStyle =
    variant === "light"
      ? "bg-white/95 border-white/25 hover:bg-white"
      : "bg-white border-[var(--border)] hover:border-[var(--border)]";

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {BRAND_BADGES.map((brand) => (
        <div
          key={brand.name}
          title={brand.name}
          className={cn(
            "rounded-md border transition-all duration-300 inline-flex items-center justify-center px-2 hover:shadow-sm",
            boxHeight,
            brand.width,
            cardStyle,
          )}
        >
          <span
            className={cn(
              "font-bold tracking-[0.08em] whitespace-nowrap",
              textSize,
              brand.tone,
            )}
          >
            {brand.label}
          </span>
        </div>
      ))}
    </div>
  );
}
