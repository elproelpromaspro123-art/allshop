import { cn } from "@/lib/utils";
import { ShoppingBag, Search, Inbox, Package, FileText, AlertTriangle } from "lucide-react";
import type { ElementType } from "react";

interface EmptyStateProps {
  variant?: "products" | "search" | "cart" | "orders" | "messages" | "error" | "custom";
  title: string;
  description?: string;
  icon?: ElementType;
  action?: React.ReactNode;
  className?: string;
  image?: React.ReactNode;
}

const VARIANT_CONFIG: Record<NonNullable<EmptyStateProps["variant"]>, {
  icon: ElementType;
  gradient: string;
  iconBg: string;
}> = {
  products: {
    icon: ShoppingBag,
    gradient: "from-emerald-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
  },
  search: {
    icon: Search,
    gradient: "from-blue-50 to-indigo-50",
    iconBg: "bg-gradient-to-br from-blue-100 to-blue-200",
  },
  cart: {
    icon: ShoppingBag,
    gradient: "from-amber-50 to-orange-50",
    iconBg: "bg-gradient-to-br from-amber-100 to-amber-200",
  },
  orders: {
    icon: Package,
    gradient: "from-violet-50 to-purple-50",
    iconBg: "bg-gradient-to-br from-violet-100 to-violet-200",
  },
  messages: {
    icon: FileText,
    gradient: "from-pink-50 to-rose-50",
    iconBg: "bg-gradient-to-br from-pink-100 to-pink-200",
  },
  error: {
    icon: AlertTriangle,
    gradient: "from-red-50 to-rose-50",
    iconBg: "bg-gradient-to-br from-red-100 to-red-200",
  },
  custom: {
    icon: Inbox,
    gradient: "from-slate-50 to-gray-50",
    iconBg: "bg-gradient-to-br from-slate-100 to-slate-200",
  },
};

export function EmptyState({
  variant = "custom",
  title,
  description,
  icon: CustomIcon,
  action,
  className,
  image,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const IconComponent = CustomIcon || config.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border border-[var(--border-subtle)] text-center",
      "bg-gradient-to-br",
      config.gradient,
      className
    )}>
      {image ? (
        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6">{image}</div>
      ) : (
        <div className={cn(
          "w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg",
          config.iconBg
        )}>
          <IconComponent className="w-9 h-9 sm:w-10 sm:h-10 text-[var(--foreground)]" />
        </div>
      )}
      
      <h3 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm sm:text-base text-[var(--muted)] max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
