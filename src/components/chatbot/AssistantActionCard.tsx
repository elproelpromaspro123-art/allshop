"use client";

import { ArrowRight, Compass, Sparkles } from "lucide-react";
import type { AssistantAction } from "@/lib/chatbot-types";
import { cn } from "@/lib/utils";

interface AssistantActionCardProps {
  action: AssistantAction;
  agentModeEnabled: boolean;
  busy?: boolean;
  executed?: boolean;
  onApprove: () => void;
  onActivateAgent: () => void;
  activateAgentLabel: string;
  approveLabel: string;
  autoModeLabel: string;
  executedLabel: string;
  runAgainLabel: string;
}

export function AssistantActionCard({
  action,
  agentModeEnabled,
  busy = false,
  executed = false,
  onApprove,
  onActivateAgent,
  activateAgentLabel,
  approveLabel,
  autoModeLabel,
  executedLabel,
  runAgainLabel,
}: AssistantActionCardProps) {
  return (
    <div className="mt-4 rounded-[1.35rem] border border-emerald-400/18 bg-emerald-400/[0.06] p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <Compass className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white/90">{action.title}</p>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                agentModeEnabled
                  ? "bg-emerald-300/15 text-emerald-200"
                  : "bg-white/[0.06] text-white/45"
              )}
            >
              {agentModeEnabled ? autoModeLabel : "Permiso requerido"}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/58">{action.description}</p>
          <p className="mt-2 text-[11px] text-white/35">
            Destino: {action.path}
            {action.sectionId ? `#${action.sectionId}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
            busy
              ? "cursor-wait bg-white/[0.08] text-white/35"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
          )}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {executed ? runAgainLabel : approveLabel}
        </button>

        {!agentModeEnabled ? (
          <button
            type="button"
            onClick={onActivateAgent}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/72 transition-colors hover:bg-white/[0.08]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {activateAgentLabel}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-3.5 py-2 text-xs font-semibold text-emerald-100/90">
            {executed ? executedLabel : autoModeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
