"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircleMore, Search, SearchX, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import { SystemStateShell } from "@/components/system/SystemStateShell";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <SystemStateShell
          tone="warning"
          eyebrow="Ruta no encontrada"
          badge="404"
          icon={<SearchX className="h-7 w-7" />}
          title={t("notFound.title")}
          subtitle={t("notFound.subtitle")}
          actions={
            <>
              <Button asChild className="gap-2 bg-slate-950 font-bold text-white hover:bg-slate-900">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  {t("notFound.backHome")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 font-semibold">
                <Link href="/seguimiento">
                  <Truck className="h-4 w-4" />
                  Seguimiento
                </Link>
              </Button>
              <Button asChild variant="ghost" className="gap-2 font-semibold">
                <Link href="/soporte">
                  <MessageCircleMore className="h-4 w-4" />
                  Soporte
                </Link>
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Button asChild variant="outline" className="justify-start gap-2 rounded-2xl py-6">
              <Link href="/">
                <Search className="h-4 w-4" />
                Explorar inicio
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2 rounded-2xl py-6">
              <Link href="/faq">
                <Search className="h-4 w-4" />
                Ver FAQ
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-2 rounded-2xl py-6">
              <Link href="/devoluciones">
                <ArrowLeft className="h-4 w-4" />
                Revisar políticas
              </Link>
            </Button>
          </div>
        </SystemStateShell>
      </div>
    </div>
  );
}
