"use client";

import Link from "next/link";
import type {
  ComponentType,
  MouseEventHandler,
  RefObject,
} from "react";
import {
  ArrowRight,
  Compass,
  Heart,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type TranslateFn = (key: string) => string;

export interface NavigationLink {
  href: string;
  label: string;
}

export interface NavigationSection {
  title: string;
  links: NavigationLink[];
}

export interface NavigationAction {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  variant?: "default" | "outline";
}

export interface NavigationShortcut {
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}

export function buildStorefrontNavigation(t: TranslateFn): NavigationLink[] {
  return [
    { href: "/categoria/cocina", label: t("nav.kitchen") },
    { href: "/categoria/tecnologia", label: t("nav.tech") },
    { href: "/categoria/hogar", label: t("nav.home") },
    { href: "/categoria/belleza", label: t("nav.beauty") },
    { href: "/categoria/fitness", label: t("nav.fitness") },
    { href: "/seguimiento", label: t("footer.track") },
    { href: "/favoritos", label: t("nav.favorites") },
    { href: "/soporte#feedback-form", label: t("nav.feedback") },
  ];
}

export function buildAdminNavigation(): NavigationLink[] {
  return [
    { href: "/panel-privado", label: "Control" },
    { href: "/panel-privado/dashboard", label: "Dashboard" },
    { href: "/panel-privado/orders", label: "Pedidos" },
    { href: "/panel-privado/inventory", label: "Inventario" },
    { href: "/", label: "Tienda" },
  ];
}

export function buildFooterSections(t: TranslateFn): NavigationSection[] {
  return [
    {
      title: t("footer.categories"),
      links: [
        { label: t("nav.kitchen"), href: "/categoria/cocina" },
        { label: t("nav.tech"), href: "/categoria/tecnologia" },
        { label: t("nav.home"), href: "/categoria/hogar" },
        { label: t("nav.beauty"), href: "/categoria/belleza" },
        { label: t("nav.fitness"), href: "/categoria/fitness" },
      ],
    },
    {
      title: t("footer.help"),
      links: [
        { label: t("footer.track"), href: "/seguimiento" },
        { label: t("footer.favorites"), href: "/favoritos" },
        { label: t("footer.shipping"), href: "/envios" },
        { label: t("footer.returns"), href: "/devoluciones" },
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.support"), href: "/soporte" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.terms"), href: "/terminos" },
        { label: t("footer.privacy"), href: "/privacidad" },
        { label: t("footer.cookies"), href: "/cookies" },
      ],
    },
  ];
}

export function buildDrawerShortcuts(
  t: TranslateFn,
  isAdminPanel: boolean,
): NavigationShortcut[] {
  if (isAdminPanel) {
    return [
      { label: "Dashboard", hint: "Control", icon: Compass },
      { label: "Pedidos", hint: "Operación", icon: ShoppingBag },
      { label: "Inventario", hint: "Stock", icon: ShieldCheck },
    ];
  }

  return [
    { label: "Buscar", hint: "⌘K", icon: Search },
    { label: t("header.favorites"), hint: "Guardar", icon: Heart },
    { label: "Bolsa", hint: "Abrir", icon: ShoppingBag },
  ];
}

export function buildDrawerActions(
  t: TranslateFn,
  isAdminPanel: boolean,
): NavigationAction[] {
  if (isAdminPanel) {
    return [
      { href: "/", label: "Ver tienda", icon: ArrowRight, variant: "default" },
      {
        href: "/panel-privado/dashboard",
        label: "Abrir dashboard",
        icon: Compass,
        variant: "outline",
      },
    ];
  }

  return [
    {
      href: "/checkout",
      label: "Ir al checkout",
      icon: ShoppingBag,
      variant: "default",
    },
    {
      href: "/favoritos",
      label: t("header.favorites"),
      icon: Heart,
      variant: "outline",
    },
  ];
}

export function NavigationBrandLockup({
  compact = false,
  className,
  onClick,
  tone = "light",
}: {
  compact?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  tone?: "light" | "dark";
}) {
  const isDarkTone = tone === "dark";

  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <div
        className={cn(
          "shell-brand-mark shrink-0",
          compact
            ? "h-10 w-10 rounded-[1.15rem]"
            : "h-11 w-11 rounded-[1.25rem]",
        )}
      >
        <span className="text-sm font-black tracking-[0.26em]">V</span>
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-black uppercase tracking-[0.34em]",
            isDarkTone ? "text-white/42" : "text-slate-500",
            compact ? "text-[0.57rem]" : "text-[0.62rem]",
          )}
        >
          Editorial Commerce
        </p>
        <p
          className={cn(
            "truncate font-black tracking-[-0.05em]",
            isDarkTone ? "text-white" : "text-slate-950",
            compact ? "text-lg" : "text-xl",
          )}
        >
          Vortixy
        </p>
      </div>
    </Link>
  );
}

export function NavigationShortcutStrip({
  className,
  items,
  title,
}: {
  className?: string;
  items: NavigationShortcut[];
  title: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-white/52">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={`${item.label}-${item.hint}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-white/82"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-300" />
              <span>{item.label}</span>
              <span className="text-white/42">{item.hint}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function NavigationTrustPills({
  className,
  isAdminPanel = false,
}: {
  className?: string;
  isAdminPanel?: boolean;
}) {
  const pills = isAdminPanel
    ? [
        { icon: ShieldCheck, label: "Control privado" },
        { icon: Compass, label: "Pedidos activos" },
        { icon: Sparkles, label: "Inventario vivo" },
      ]
    : [
        { icon: Truck, label: "Envíos a toda Colombia" },
        { icon: ShieldCheck, label: "Pago contraentrega" },
        { icon: Sparkles, label: "Soporte humano" },
      ];

  return (
    <div className={cn("flex flex-wrap gap-2.5 text-xs font-semibold", className)}>
      {pills.map((pill) => {
        const Icon = pill.icon;
        return (
          <span
            key={pill.label}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-white/76"
          >
            <Icon className="h-3.5 w-3.5 text-emerald-300" />
            {pill.label}
          </span>
        );
      })}
    </div>
  );
}

export function NavigationLinkRail({
  className,
  links,
  pathname,
}: {
  className?: string;
  links: NavigationLink[];
  pathname: string;
}) {
  return (
    <nav
      className={cn("shell-header__nav-rail", className)}
      aria-label="Navegación principal"
    >
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="shell-header__nav-link"
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavigationFooterSections({
  className,
  sections,
}: {
  className?: string;
  sections: NavigationSection[];
}) {
  return (
    <div
      className={cn("grid gap-10 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">
            {section.title}
          </h3>
          <ul className="space-y-3">
            {section.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group inline-flex items-center gap-2 text-sm text-white/74 transition-colors hover:text-white"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function NavigationDrawer({
  actions,
  className,
  isAdminPanel,
  links,
  menuRef,
  onClose,
  onOpenSearch,
  pathname,
  shortcuts,
}: {
  actions: NavigationAction[];
  className?: string;
  isAdminPanel: boolean;
  links: NavigationLink[];
  menuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onOpenSearch: () => void;
  pathname: string;
  shortcuts: NavigationShortcut[];
}) {
  return (
    <div
      id="mobile-menu-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
      className="fixed inset-y-0 right-0 z-[65] w-full max-w-[24rem] lg:hidden"
    >
      <div
        ref={menuRef}
        className={cn(
          "shell-header__drawer flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6",
          className,
        )}
      >
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <NavigationBrandLockup compact tone="light" onClick={onClose} />
          <div className="editorial-kicker">
            {isAdminPanel ? "Panel privado" : "Navegación Vortixy"}
          </div>
            <div>
              <h2
                id="mobile-menu-title"
                className="text-2xl font-black tracking-[-0.05em] text-slate-950"
              >
                {isAdminPanel
                  ? "Controla el catálogo desde un solo lugar."
                  : "Catálogo, búsqueda y checkout en una sola capa."}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isAdminPanel
                  ? "Accede rápido a pedidos, inventario y vista pública sin saltos de contexto."
                  : "Accede rápido a categorías, seguimiento, favoritos y soporte sin perder el hilo de compra."}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-[rgba(23,19,15,0.08)] bg-white/80 text-slate-700"
            onClick={onClose}
          aria-label="Cerrar menú"
        >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 space-y-3 rounded-[1.6rem] border border-[rgba(23,19,15,0.08)] bg-white/78 p-4 shadow-[0_18px_44px_rgba(23,19,15,0.06)]">
          <button
            type="button"
            onClick={() => {
              onOpenSearch();
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-[1.1rem] px-1 py-2 text-left"
          >
            <span className="flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-900">
                {isAdminPanel ? "Buscar en el panel" : "Buscar productos"}
              </span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              ⌘K
            </span>
          </button>

          <NavigationShortcutStrip
            title={isAdminPanel ? "Accesos directos" : "Atajos rápidos"}
            items={shortcuts}
          />

          <div className="rounded-[1.1rem] border border-[rgba(23,19,15,0.08)] bg-[rgba(248,245,240,0.9)] px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {isAdminPanel
                    ? "Acceso privado y navegación sin ruido"
                    : "Pago contraentrega y soporte real"}
                </p>
                <p className="text-xs leading-5 text-slate-600">
                  {isAdminPanel
                    ? "Mantén el control de catálogo, pedidos e inventario sin abrir otras pantallas."
                    : "Mantenemos la promesa principal del storefront con una navegación más clara y móvil-first."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between rounded-[1.2rem] border px-4 py-4 transition-all",
                  isActive
                    ? "border-[rgba(13,138,99,0.18)] bg-[rgba(13,138,99,0.08)] text-slate-950 shadow-[0_16px_38px_rgba(13,138,99,0.12)]"
                    : "border-[rgba(23,19,15,0.08)] bg-white/72 text-slate-800 shadow-[0_12px_32px_rgba(23,19,15,0.04)]",
                )}
              >
                <span className="flex items-center gap-3">
                  <Compass className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold">{link.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-8">
          <NavigationTrustPills isAdminPanel={isAdminPanel} className="mb-1" />
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                variant={action.variant ?? "default"}
                size="lg"
                className={cn(
                  "w-full gap-2",
                  action.variant === "outline" &&
                    "border-[rgba(23,19,15,0.08)] bg-white/80 text-slate-900",
                )}
              >
                <Link href={action.href} onClick={onClose}>
                  {action.label}
                  <Icon className="h-4 w-4" />
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function NavigationFooterTrust({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white/76">
        <Truck className="h-3.5 w-3.5 text-emerald-300" />
        Envíos a toda Colombia
      </span>
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white/76">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
        Pago contraentrega
      </span>
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white/76">
        <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
        Soporte humano
      </span>
    </div>
  );
}

export function NavigationFooterPromo({
  className,
  subtitle,
  title,
  onBackToTop,
}: {
  className?: string;
  subtitle: string;
  title: string;
  onBackToTop?: () => void;
  }) {
  return (
    <div className={cn("space-y-5", className)}>
      <NavigationBrandLockup compact tone="dark" />
      <div className="space-y-2">
        <p className="text-sm leading-7 text-white/68">{title}</p>
        <p className="text-sm leading-7 text-white/48">{subtitle}</p>
      </div>
      <NavigationFooterTrust />
      {onBackToTop ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-white/10 bg-white/8 text-white/88 hover:bg-white/14"
          onClick={onBackToTop}
        >
          Volver arriba
          <ArrowRight className="h-3.5 w-3.5 rotate-[-45deg]" />
        </Button>
      ) : null}
    </div>
  );
}
