"use client";

import { Search, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = [Search, Sparkles, MessageCircle] as const;

export function AssistantWelcome({
  eyebrow,
  title,
  body,
  startersLabel,
  prompts,
  onPrompt,
  featureResearchTitle,
  featureResearchBody,
  featureClarityTitle,
  featureClarityBody,
  featureHandoffTitle,
  featureHandoffBody,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  startersLabel: string;
  prompts: string[];
  onPrompt: (prompt: string) => void;
  featureResearchTitle: string;
  featureResearchBody: string;
  featureClarityTitle: string;
  featureClarityBody: string;
  featureHandoffTitle: string;
  featureHandoffBody: string;
  compact?: boolean;
}) {
  const features = [
    { title: featureResearchTitle, body: featureResearchBody },
    { title: featureClarityTitle, body: featureClarityBody },
    { title: featureHandoffTitle, body: featureHandoffBody },
  ];

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center",
        compact ? "justify-start px-0 pb-3 pt-2" : "justify-center px-1.5",
      )}
    >
      <div
        className={cn(
          "w-full text-center",
          compact ? "max-w-full space-y-5 pb-1 pr-1" : "max-w-md space-y-6",
        )}
      >
        {/* Icon + header */}
        <div>
          <div
            className={cn(
              "mx-auto flex items-center justify-center rounded-2xl bg-emerald-500/10",
              compact ? "mb-3 h-10 w-10" : "mb-4 h-12 w-12",
            )}
          >
            <Sparkles
              className={cn(
                "text-emerald-400",
                compact ? "h-4.5 w-4.5" : "h-5 w-5",
              )}
            />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/50">
            {eyebrow}
          </p>
          <h3
            className={cn(
              "font-bold leading-snug text-white/95",
              compact ? "mt-1.5 text-[18px]" : "mt-2 text-[21px]",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "mx-auto mt-2.5 text-[12px] leading-relaxed text-white/45",
              compact ? "max-w-sm" : "max-w-xs",
            )}
          >
            {body}
          </p>
        </div>

        {/* Feature cards */}
        <div
          className={cn(
            "grid",
            compact ? "grid-cols-1 gap-2" : "grid-cols-3 gap-2.5",
          )}
        >
          {features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div
                key={feature.title}
                className={cn(
                  "rounded-xl border border-[#1e2e28] bg-[#141e1a]",
                  compact
                    ? "flex items-start gap-3 px-3.5 py-3 text-left"
                    : "px-3.5 py-3.5 text-center",
                )}
              >
                <Icon
                  className={cn(
                    "shrink-0 text-emerald-400/50",
                    compact ? "mt-0.5 h-4 w-4" : "mx-auto mb-2 h-4 w-4",
                  )}
                />
                <div className={cn(compact ? "min-w-0" : undefined)}>
                  <p className="text-[11px] font-semibold leading-tight text-white/80">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-white/35">
                    {feature.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick prompts */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
            {startersLabel}
          </p>
          <div
            className={cn("flex flex-col", compact ? "gap-2 pb-1" : "gap-2")}
          >
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onPrompt(prompt)}
                className={cn(
                  "w-full border border-[#1e2e28] bg-[#141e1a] text-left text-[13px] text-white/60 transition-all hover:border-emerald-500/25 hover:bg-[#1a2820] hover:text-white/80",
                  compact
                    ? "rounded-xl px-3.5 py-3"
                    : "rounded-xl px-4 py-3",
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
