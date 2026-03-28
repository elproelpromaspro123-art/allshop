import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Home, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AdminRouteFrameProps {
  children: ReactNode;
  className?: string;
}

export function AdminRouteFrame({ children, className }: AdminRouteFrameProps) {
  return (
    <div className={cn("admin-shell min-h-screen", className)}>
      <div className="page-shell flex min-h-screen flex-col gap-4 py-4 sm:gap-5 sm:py-6 lg:gap-6 lg:py-8">
        <header className="panel-surface flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="grid gap-1">
              <p className="page-header-kicker">Panel privado</p>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                Centro operativo Vortixy
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-gray-500">
                Acceso restringido para catálogo, pedidos e inventario con una
                sola superficie de control.
              </p>
            </div>
          </div>

          <div className="panel-toolbar justify-start">
            <span className="panel-chip border-emerald-200 bg-emerald-50 text-emerald-700">
              Sesion segura
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Tienda
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
