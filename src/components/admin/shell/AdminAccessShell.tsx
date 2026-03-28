import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AdminAccessShellProps {
  eyebrow: string;
  title: string;
  description: string;
  currentStep: 1 | 2 | 3;
  currentStepLabel: string;
  children: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
}

const steps = [
  {
    step: 1,
    label: "Clave privada",
    description: "Verificacion inicial del acceso.",
  },
  {
    step: 2,
    label: "Sesion segura",
    description: "Sesiones firmadas y protegidas.",
  },
  {
    step: 3,
    label: "Panel operativo",
    description: "Gestión de catálogo y pedidos.",
  },
] as const;

export function AdminAccessShell({
  eyebrow,
  title,
  description,
  currentStep,
  currentStepLabel,
  children,
  action,
  footer,
}: AdminAccessShellProps) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="grid gap-4">
        <div className="panel-surface overflow-hidden">
          <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="page-header-kicker">{eyebrow}</p>
              <span className="panel-chip border-emerald-200 bg-emerald-50 text-emerald-700">
                {currentStepLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {title}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Privado
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
                  {description}
                </p>
              </div>

              {action ? <div className="flex items-center gap-2">{action}</div> : null}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {steps.map((step) => {
                const active = currentStep === step.step;
                const completed = currentStep > step.step;

                return (
                  <div
                    key={step.step}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition-all",
                      active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_12px_28px_rgba(16,185,129,0.1)]"
                        : completed
                          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 bg-white text-gray-500",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
                        Paso {step.step}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                          active
                            ? "bg-emerald-600 text-white"
                            : completed
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {step.step}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{step.label}</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-80">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="panel-chip border-emerald-200 bg-emerald-50 text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Lenguaje premium
              </span>
              <span className="panel-chip">Sincronizacion en vivo</span>
              <span className="panel-chip">Control manual</span>
            </div>
          </div>

          <div className="p-5 sm:p-6">{children}</div>
        </div>

        {footer ? <div>{footer}</div> : null}

        <div className="panel-toolbar justify-between px-1 text-xs text-gray-500">
          <p>Panel privado de operacion y control comercial.</p>
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="gap-2">
              Ver tienda
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
