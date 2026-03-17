import { Heart, MapPin, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

const BORDER_COLORS = [
  "border-top-secondary",
  "border-top-accent",
  "border-top-warm",
];

export function AboutSection({ className }: { className?: string }) {
  const { t } = useLanguage();

  const values = [
    {
      Icon: MapPin,
      title: t("about.values.origin.title"),
      text: t("about.values.origin.text"),
    },
    {
      Icon: MessageCircle,
      title: t("about.values.support.title"),
      text: t("about.values.support.text"),
    },
    {
      Icon: Package,
      title: t("about.values.catalog.title"),
      text: t("about.values.catalog.text"),
    },
  ];

  const iconColors = [
    "bg-indigo-50 text-indigo-600",
    "bg-emerald-50 text-emerald-600",
    "bg-amber-50 text-amber-600",
  ];

  return (
    <section className={cn("py-16 sm:py-24 bg-[var(--gradient-section)]", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <p className="section-badge mb-3">
              {t("about.badge")}
            </p>
            <h2 className="text-[var(--foreground)]">
              <span className="text-gradient-subtle">{t("about.title")}</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-xl">
              {t("about.subtitle")}
            </p>

            {/* Inline stats */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5 bg-[var(--surface-muted)] rounded-full px-3 py-1.5">
                📦 100+ pedidos
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[var(--surface-muted)] rounded-full px-3 py-1.5">
                🇨🇴 Colombia
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[var(--surface-muted)] rounded-full px-3 py-1.5">
                ✉️ Respuesta rápida
              </span>
            </div>

            <div className="mt-6 inline-flex items-center gap-2.5 text-sm text-[var(--muted)] bg-[var(--warm-surface)]/50 rounded-xl px-4 py-3">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span>{t("about.thanks")}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  "group bento-card p-5 sm:p-6 scroll-reveal",
                  BORDER_COLORS[index % BORDER_COLORS.length]
                )}
                data-delay={index + 1}
              >
                <div className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                  iconColors[index % iconColors.length]
                )}>
                  <item.Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
