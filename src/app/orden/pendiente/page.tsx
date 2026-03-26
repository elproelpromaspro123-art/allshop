"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Info, Mail, Package, RefreshCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OrderStatusHero } from "@/components/orders/OrderStatusHero";
import { useLanguage } from "@/providers/LanguageProvider";

function OrderPendingContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const reference = orderId || paymentId;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!reference) return;
    void navigator.clipboard.writeText(reference);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <OrderStatusHero
          tone="warning"
          badge="Pedido en revision"
          title={t("order.pendingTitle")}
          subtitle={t("order.pendingDescription")}
          reference={reference}
          referenceLabel="Referencia de seguimiento"
          icon="pending"
          actions={
            <>
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  Volver al inicio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/seguimiento">
                  Revisar seguimiento
                  <Search className="h-4 w-4" />
                </Link>
              </Button>
            </>
          }
          note={
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-sm leading-6 text-slate-700">
                    {t("order.pendingSubtitle")} El equipo valida stock, cobertura y datos antes de seguir con el despacho.
                  </p>
                </div>
              </div>
              {reference ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                    copied
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950",
                  )}
                >
                  {copied ? "Referencia copiada" : "Copiar referencia"}
                </button>
              ) : null}
            </div>
          }
        />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Revision
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Verificamos stock, cobertura y consistencia del pedido antes del siguiente paso.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Tiempo estimado
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Suele resolverse en la misma franja operativa del dia.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Soporte
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Si necesitas contexto adicional, usa soporte o vuelve al seguimiento con tu referencia.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <Package className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {t("order.nextSteps")}
              </p>
              <p className="text-sm text-slate-500">
                El pedido sigue vivo, solo falta completar la validacion operativa.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Confirmamos los datos de entrega.",
              "Revisamos cobertura y stock final.",
              "Cuando todo cierra, liberamos el despacho.",
              "Te avisamos si hace falta ajustar algo.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="gap-2">
            <Link href="/soporte#feedback-form">
              Abrir soporte
              <Mail className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/seguimiento">
              Ver seguimiento
              <RefreshCcw className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="mx-auto max-w-lg px-4 py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-700" />
          </div>
        </div>
      }
    >
      <OrderPendingContent />
    </Suspense>
  );
}
