import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Mail, ShieldCheck, Waypoints } from "lucide-react";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { MyOrdersPanel } from "@/components/orders/MyOrdersPanel";
import { OrderStatusHero } from "@/components/orders/OrderStatusHero";
import { buttonVariants } from "@/components/ui/button-variants";
import { getServerT } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import {
  buildStaticPageBreadcrumbs,
  buildStaticPageMetadata,
  generateBreadcrumbJsonLd,
  generateWebPageJsonLd,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return buildStaticPageMetadata({
    title: t("policy.tracking.title"),
    description: t("policy.tracking.metaDescription"),
    path: "/seguimiento",
    index: false,
  });
}

export default async function TrackingPage() {
  const t = await getServerT();
  const title = t("policy.tracking.title");
  const description = t("policy.tracking.metaDescription");
  const structuredData = [
    generateWebPageJsonLd({
      title,
      description,
      path: "/seguimiento",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/seguimiento",
        type: "help",
      }),
    ),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <StaticPageLayout
        title={title}
        subtitle={t("policy.tracking.subtitle")}
        updatedAt="2026-03-14"
        type="help"
        path="/seguimiento"
      >
      <OrderStatusHero
        tone="success"
        badge="Seguimiento en tiempo real"
        title="Revisa tu pedido y vuelve cuando lo necesites."
        subtitle="Busca por correo, telefono y documento para ver tus pedidos, revisar su estado y consultar el detalle sin depender de correos viejos o enlaces perdidos."
        reference={null}
        referenceLabel="Acceso rapido"
        icon="tracking"
        actions={
          <>
            <Link
              href="/soporte#feedback-form"
              className={buttonVariants({ size: "lg", className: "gap-2" })}
            >
                Abrir soporte
                <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "gap-2",
              })}
            >
                Ver FAQ
                <Clock3 className="h-4 w-4" />
            </Link>
          </>
        }
        note={
          <div className="inline-flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("policy.tracking.emailNotice")}</p>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700">
            <Waypoints className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-950">
            Todos tus pedidos juntos
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Entra con tus datos y mira todo en un mismo lugar, sin buscar links
            sueltos en el correo.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-950">
            Se actualiza solo
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            El panel refresca estados y movimientos para que no tengas que
            entrar cada rato a revisar.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-950">
            Tus datos van protegidos
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Solo se muestra la informacion necesaria y el acceso sigue
            protegido para cuidar tus datos.
          </p>
        </div>
      </div>

      <div className="not-prose" id="seguimiento-panel">
        <MyOrdersPanel />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ContentBlock title={t("policy.tracking.howTitle")}>
          <ContentList
            items={[
              t("policy.tracking.how1"),
              t("policy.tracking.how2"),
              t("policy.tracking.how3"),
            ]}
          />
        </ContentBlock>

        <ContentBlock title={t("policy.tracking.timesTitle")}>
          <ContentList
            items={[
              t("policy.tracking.times1"),
              t("policy.tracking.times2"),
              t("policy.tracking.times3"),
            ]}
          />
        </ContentBlock>

        <ContentBlock
          title={t("policy.tracking.noMovementTitle")}
          variant="highlight"
        >
          <p>{t("policy.tracking.noMovementText")}</p>
        </ContentBlock>
      </div>

      <div className="not-prose rounded-2xl border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-[0_22px_65px_rgba(15,23,42,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-emerald-300">
              Soporte operativo
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
              Tu pedido no muestra movimiento
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Si despues de 24 horas habiles no ves cambios en revision o
              despacho, escribenos con tu referencia y revisamos que paso.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/soporte#feedback-form"
              className={buttonVariants({
                size: "lg",
                className: "gap-2 bg-white text-slate-950 hover:bg-emerald-50",
              })}
            >
                Abrir soporte
                <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:soporte@vortixy.net"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "gap-2 border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white",
              })}
            >
                <Mail className="h-4 w-4" />
                soporte@vortixy.net
            </a>
          </div>
        </div>
      </div>
      </StaticPageLayout>
    </>
  );
}
