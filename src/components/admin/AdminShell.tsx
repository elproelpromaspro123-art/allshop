"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutGrid, Package, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  eyebrow: string;
  title: string;
  description: string;
  toolbar?: ReactNode;
  children: ReactNode;
}

const links = [
  { href: "/panel-privado", label: "Control", icon: SlidersHorizontal },
  { href: "/panel-privado/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/panel-privado/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/panel-privado/inventory", label: "Inventario", icon: Package },
];

export function AdminShell({
  eyebrow,
  title,
  description,
  toolbar,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <section className="admin-shell">
      <div className="panel-shell grid gap-6">
        <div className="panel-surface px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-4">
              <PageHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
              />
              <div className="panel-toolbar">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "panel-chip transition-all hover:-translate-y-0.5",
                        active &&
                          "border-emerald-300/40 bg-emerald-50 text-emerald-700 shadow-[0_12px_28px_rgba(16,185,129,0.1)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="panel-toolbar justify-start lg:justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href="/panel-privado">Volver a control</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Volver a tienda</Link>
              </Button>
              {toolbar}
            </div>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
