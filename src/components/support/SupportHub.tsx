import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  HelpCircle,
  Mail,
  MessageCircle,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SUPPORT_EMAIL, WHATSAPP_PHONE } from "@/lib/site";
import { getServerT } from "@/lib/i18n";

const whatsappLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  "Hola, vengo desde Vortixy y necesito ayuda con mi pedido o un producto.",
)}`;

export async function SupportHub() {
  const t = await getServerT();

  const quickLinks = [
    {
      href: `mailto:${SUPPORT_EMAIL}`,
      label: t("policy.support.emailLabel"),
      value: SUPPORT_EMAIL,
      icon: Mail,
    },
    {
      href: whatsappLink,
      label: "WhatsApp",
      value: `+${WHATSAPP_PHONE}`,
      icon: MessageCircle,
    },
    {
      href: "/seguimiento",
      label: "Seguimiento",
      value: "Revisar mi pedido",
      icon: PackageSearch,
    },
    {
      href: "/devoluciones",
      label: "Devoluciones",
      value: "Cambios y garantias",
      icon: RotateCcw,
    },
  ];

  const supportSignals = [
    {
      icon: Clock3,
      title: t("policy.support.responseTimesTitle"),
      text: t("policy.support.responseTimesText"),
    },
    {
      icon: ShieldCheck,
      title: t("policy.support.officialEmailNotice"),
      text: "Usa los canales oficiales para revisar pedidos, envios o novedades.",
    },
    {
      icon: HelpCircle,
      title: "Antes de escribir",
      text: "Ten a mano tu nombre, el correo de compra y el número de pedido para ayudarte más rápido.",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_32%),linear-gradient(135deg,#0f172a_0%,#111827_55%,#0f3a2e_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/5 blur-3xl" />

          <div className="relative space-y-6">
            <div className="editorial-kicker border-white/10 bg-white/10 text-white/85 before:shadow-[0_0_0_0.35rem_rgba(16,185,129,0.16)]">
              Soporte Vortixy
            </div>

            <div className="space-y-3">
              <h2 className="max-w-2xl text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Habla con nosotros sin complicarte.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                {t("policy.support.subtitle")} Te ayudamos con pedidos,
                devoluciones, seguimiento y dudas antes de comprar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 text-xs font-semibold text-white/84">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
                Respuesta en 24h habiles
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                <Mail className="h-3.5 w-3.5 text-emerald-300" />
                {SUPPORT_EMAIL}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-300" />
                WhatsApp activo
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="#feedback-form">
                  Abrir formulario
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/seguimiento">
                  Ver seguimiento
                  <PackageSearch className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-8 lg:px-8 lg:py-10">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {item.value}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        Ir
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-3">
            {supportSignals.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
