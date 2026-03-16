import { Heart, MapPin, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

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
    "bg-[var(--secondary-surface)] text-[var(--secondary-strong)]",
    "bg-[var(--accent-surface)] text-[var(--accent-strong)]",
    "bg-[var(--warm-surface)] text-amber-600",
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
            <div className="mt-8 flex items-center gap-2.5 text-sm text-[var(--muted)]">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span>{t("about.thanks")}</span>
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((item, index) => (
            <div
              key={item.title}
              className="group bento-card p-5 sm:p-6"
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${iconColors[index % iconColors.length]}`}>
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
