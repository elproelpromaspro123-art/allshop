"use client";

import { ArrowRight, Compass, ShoppingBag, Sparkles } from "lucide-react";
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
  const ActionIcon = action.type === "navigate" ? Compass : ShoppingBag;
  const destinationLine =
    action.type === "navigate"
      ? `${action.path}${action.sectionId ? `#${action.sectionId}` : ""}`
      : action.type === "add_to_cart_and_checkout"
        ? `/checkout`
        : `x${action.quantity || 1}`;
  const primaryLabel = executed ? runAgainLabel : action.label || approveLabel;

  return (
    <div className="mt-2.5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-2.5 text-left">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-300">
          <ActionIcon className="h-3 w-3" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-semibold text-white/88">
              {action.title}
            </p>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                agentModeEnabled
                  ? "bg-emerald-300/12 text-emerald-200"
                  : "bg-white/[0.05] text-white/40",
              )}
            >
              {agentModeEnabled ? autoModeLabel : "Confirmar"}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] leading-relaxed text-white/52">
            {action.description}
          </p>
          <p className="mt-1 text-[9px] text-white/30">{destinationLine}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors",
            busy
              ? "cursor-wait bg-white/[0.06] text-white/30"
              : "bg-emerald-500 text-white hover:bg-emerald-400",
          )}
        >
          <ArrowRight className="h-2.5 w-2.5" />
          {primaryLabel}
        </button>

        {!agentModeEnabled ? (
          <button
            type="button"
            onClick={onActivateAgent}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-white/65 transition-colors hover:bg-white/[0.06]"
          >
            <Sparkles className="h-2.5 w-2.5" />
            {activateAgentLabel}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-md border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1.5 text-[10px] font-semibold text-emerald-100/85">
            {executed ? executedLabel : autoModeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
