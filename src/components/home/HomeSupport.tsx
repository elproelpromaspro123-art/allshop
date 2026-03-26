"use client";

import Link from "next/link";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_PHONE } from "@/lib/site";

const supportOptions = [
  {
    href: `https://wa.me/${WHATSAPP_PHONE}`,
    title: "WhatsApp",
    description: "Respuesta rapida con contexto real sobre producto, pedido y cobertura.",
    label: "Minutos, no horas",
    icon: MessageCircle,
    accent: "from-emerald-50 to-green-50 text-emerald-700",
    external: true,
  },
  {
    href: "/faq",
    title: "Preguntas frecuentes",
    description: "Todo lo importante sobre envios, pagos, cambios y devoluciones.",
    label: "Resuelve la duda ya",
    icon: HelpCircle,
    accent: "from-indigo-50 to-violet-50 text-indigo-700",
    external: false,
  },
  {
    href: "/soporte",
    title: "Formulario de contacto",
    description: "Dejanos tu consulta y la seguimos hasta que quede resuelta.",
    label: "Para casos detallados",
    icon: Mail,
    accent: "from-amber-50 to-orange-50 text-amber-700",
    external: false,
  },
];

export function HomeSupport() {
  return (
    <section
      data-home-slide=""
      data-density="balanced"
      data-tone="base"
      className="v-section"
    >
      <div className="v-section-inner">
        <div className="v-section-grid" data-layout="split">
          <div className="v-editorial-copy">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-700 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
              Soporte
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Si algo necesita una mano, hay una persona del otro lado.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Elegi el canal que te resuelva mas rapido y te respondemos con
                contexto, no con respuestas vacias.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.18)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-200/78">
                  Atencion real
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight">
                  Hay personas reales leyendo cada mensaje.
                </p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  Respondemos por WhatsApp en minutos y por email con seguimiento
                  cuando el caso necesita detalle.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                  Antes y despues
                </p>
                <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                  Te acompanamos mas alla del checkout.
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Desde la duda inicial hasta el seguimiento final del pedido.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full gap-2 px-8 sm:w-auto">
                <Link href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank" rel="noopener noreferrer">
                  Abrir WhatsApp
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full px-8 sm:w-auto"
              >
                <Link href="/soporte">Ver todas las opciones</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {supportOptions.map((item, index) => (
              <Link
                key={item.title}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className={`group rounded-[1.7rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_28px_70px_rgba(16,185,129,0.14)] sm:p-6 ${
                  index === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex h-full flex-col gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br ${item.accent}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-emerald-700/80">
                      {item.label}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="v-section-divider" />
    </section>
  );
}
