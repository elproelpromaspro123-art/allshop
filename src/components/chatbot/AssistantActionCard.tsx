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
      ? `Destino: ${action.path}${action.sectionId ? `#${action.sectionId}` : ""}`
      : action.type === "add_to_cart_and_checkout"
        ? `Producto: ${action.product.name} - Siguiente paso: /checkout`
        : `Producto: ${action.product.name} - Cantidad: ${action.quantity || 1}`;
  const primaryLabel = executed ? runAgainLabel : action.label || approveLabel;

  return (
    <div className="mt-3 rounded-[1.2rem] border border-emerald-400/18 bg-emerald-400/[0.06] p-3.5 text-left">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.95rem] bg-emerald-500/15 text-emerald-300">
          <ActionIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-white/90">{action.title}</p>
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
          <p className="mt-1 text-[11px] leading-relaxed text-white/58">{action.description}</p>
          <p className="mt-1.5 text-[10px] text-white/35">
            {destinationLine}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
            busy
              ? "cursor-wait bg-white/[0.08] text-white/35"
              : "bg-emerald-500 text-white hover:bg-emerald-400"
            )}
        >
          <ArrowRight className="h-3 w-3" />
          {primaryLabel}
        </button>

        {!agentModeEnabled ? (
          <button
            type="button"
            onClick={onActivateAgent}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/72 transition-colors hover:bg-white/[0.08]"
          >
            <Sparkles className="h-3 w-3" />
            {activateAgentLabel}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-1.5 text-[11px] font-semibold text-emerald-100/90">
            {executed ? executedLabel : autoModeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
