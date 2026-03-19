import { cn } from "@/lib/utils";

interface AppLoadScreenProps {
  phase?: string;
  headline?: string;
  overlay?: boolean;
  className?: string;
}

export function AppLoadScreen({
  phase = "Preparando una vitrina mas limpia",
  headline = "Entrando a Vortixy",
  overlay = false,
  className,
}: AppLoadScreenProps) {
  return (
    <div
      className={cn(
        overlay ? "fixed inset-0 z-[120]" : "relative min-h-screen",
        "app-loader-shell text-white",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-loader-grid" />
      <div className="app-loader-orb app-loader-orb-primary" />
      <div className="app-loader-orb app-loader-orb-secondary" />

      <div className="relative z-[1] flex min-h-[100svh] items-center justify-center px-5 py-10 sm:px-6 sm:py-12">
        <div className="app-loader-card">
          <span className="app-loader-badge">Vortixy</span>

          <div className="app-loader-mark" aria-hidden="true">
            <span className="app-loader-ring" />
            <span className="app-loader-ring app-loader-ring-alt" />
            <span className="app-loader-core">V</span>
            <span className="app-loader-dot" />
          </div>

          <p className="mx-auto text-center font-display text-[2rem] leading-none tracking-[-0.06em] text-white sm:text-[2.8rem]">
            {headline}
          </p>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-white/64 sm:text-base">
            {phase}
          </p>

          <div className="app-loader-progress" aria-hidden="true">
            <span className="app-loader-progress-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
