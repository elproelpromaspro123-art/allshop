import { BarChart3, Megaphone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CookieConsent,
  getCookieConsentStatus,
} from "@/lib/cookie-consent";

interface CookieConsentMatrixProps {
  consent?: CookieConsent | null;
  className?: string;
}

const ICONS = {
  necessary: ShieldCheck,
  analytics: BarChart3,
  marketing: Megaphone,
} as const;

export function CookieConsentMatrix({
  consent = null,
  className,
}: CookieConsentMatrixProps) {
  const items = getCookieConsentStatus(consent);

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.key];
        return (
          <article
            key={item.key}
            className={cn(
              "rounded-[1.75rem] border p-5 shadow-sm",
              item.required
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-white",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/70 bg-white p-3 shadow-sm">
                  <Icon className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {item.required ? "Base" : "Opcional"}
                  </p>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {item.enabled ? "Activa" : "Desactivada"}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {item.description}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Lo que cubre
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                {item.examples.map((example) => (
                  <li key={example} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">
                {item.controlLabel}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {item.required ? "No se desactiva" : "Puede ajustarse"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
