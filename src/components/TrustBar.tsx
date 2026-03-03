import { Shield, CreditCard, RotateCcw, Lock, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBarProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "compact";
}

const trustItems = [
  {
    icon: Shield,
    title: "Garantía AllShop",
    description: "Devolución local en Colombia",
  },
  {
    icon: CreditCard,
    title: "Pago Seguro",
    description: "Mercado Pago · PSE · Tarjetas",
  },
  {
    icon: RotateCcw,
    title: "Devolución Gratis",
    description: "30 días para cambios",
  },
  {
    icon: Lock,
    title: "Sitio Protegido",
    description: "Certificado SSL 256-bit",
  },
  {
    icon: Headphones,
    title: "Soporte 24/7",
    description: "WhatsApp + Email",
  },
];

export function TrustBar({ className, variant = "horizontal" }: TrustBarProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center justify-center gap-6 py-3 text-neutral-500", className)}>
        {trustItems.slice(0, 4).map((item) => (
          <div key={item.title} className="flex items-center gap-1.5">
            <item.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item) => (
          <div key={item.title} className="flex items-center gap-3 text-neutral-600">
            <div className="flex-shrink-0 w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center">
              <item.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="text-xs text-neutral-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {trustItems.map((item) => (
        <div key={item.title} className="flex flex-col items-center text-center gap-2 p-4">
          <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-700">
            <item.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
            <p className="text-xs text-neutral-500">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
