"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderStatusHero } from "@/components/orders/OrderStatusHero";

export default function OrderErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <OrderStatusHero
          tone="danger"
          badge="No se pudo confirmar"
          title="No se pudo confirmar el pedido"
          subtitle="La orden no quedo registrada. Puedes reintentar sin perder contexto o volver al checkout para revisar los datos."
          reference={null}
          referenceLabel="Referencia de error"
          icon="danger"
          actions={
            <>
              <Button asChild size="lg" className="gap-2">
                <Link href="/checkout">
                  Reintentar
                  <RefreshCcw className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Link>
              </Button>
            </>
          }
          note={
            <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-950">
                    Sin cobro adelantado
                  </p>
                  <p className="text-sm leading-6 text-slate-700">
                    El pedido no quedo registrado, asi que puedes volver a intentarlo con seguridad o escribir a soporte si el error persiste.
                  </p>
                </div>
              </div>
            </div>
          }
        />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Paso 1
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Revisa que la direccion y los datos de contacto esten completos.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Paso 2
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Si el problema persiste, vuelve al checkout para reenviar el pedido.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Paso 3
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Usa soporte para validar cobertura, stock o cualquier error de red.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Proximos pasos
              </p>
              <p className="text-sm text-slate-500">
                Puedes reintentar ahora mismo sin perder contexto del carrito.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/soporte#feedback-form">
                Abrir soporte
                <AlertTriangle className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/faq">
                Ver FAQ
                <RefreshCcw className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
