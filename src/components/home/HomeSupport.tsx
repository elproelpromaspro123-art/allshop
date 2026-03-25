"use client";

import Link from "next/link";
import { MessageCircle, Mail, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_PHONE } from "@/lib/site";

export function HomeSupport() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-8 shadow-sm sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Soporte
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              ¿Necesitas ayuda?
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Escríbenos por WhatsApp, revisa las preguntas frecuentes o déjanos un mensaje.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Link
                href={`https://wa.me/${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-gray-900">WhatsApp</p>
                <p className="mt-1 text-xs text-gray-500">Respuesta rápida</p>
              </Link>

              <Link
                href="/faq"
                className="flex flex-col items-center rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-gray-900">Preguntas frecuentes</p>
                <p className="mt-1 text-xs text-gray-500">Dudas resueltas</p>
              </Link>

              <Link
                href="/soporte"
                className="flex flex-col items-center rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-gray-900">Formulario</p>
                <p className="mt-1 text-xs text-gray-500">Nos ponemos en contacto</p>
              </Link>
            </div>

            <div className="mt-8">
              <Button asChild variant="outline" size="lg" className="gap-2 px-8">
                <Link href="/soporte">Ver todas las opciones de soporte</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
