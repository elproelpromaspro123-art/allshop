import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerT } from "@/lib/i18n";

export default async function NotFound() {
  const t = await getServerT();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--background)] overflow-hidden">
      {/* Decorative grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Gradient blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[120px]" />

      {/* 404 watermark */}
      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] sm:text-[18rem] font-black tracking-tighter text-[var(--foreground)] opacity-[0.03] select-none leading-none">
        404
      </span>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-6 text-center">
        {/* Icon container */}
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[var(--accent)]/10"
          style={{
            background: "linear-gradient(135deg, var(--accent-strong), var(--accent-dim))",
          }}
        >
          <SearchX className="w-11 h-11 text-white" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--foreground)] mb-4">
          {t("notFound.title")}
        </h1>
        <p className="text-[var(--muted)] text-lg leading-relaxed mb-10 max-w-sm mx-auto">
          {t("notFound.subtitle")}
        </p>

        <Link href="/">
          <Button size="lg">
            <ArrowLeft className="w-4 h-4" />
            {t("notFound.backHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
