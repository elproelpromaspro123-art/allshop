"use client";

import { LoaderCircle } from "lucide-react";

export function AssistantThinkingCard({
  loadingTitle,
  loadingSearch,
  loadingVisit,
  loadingAnswer,
}: {
  loadingTitle: string;
  loadingSearch: string;
  loadingVisit: string;
  loadingAnswer: string;
}) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[80%] space-y-3 pl-1">
        <div className="flex items-center gap-2 text-emerald-300/70">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
            {loadingTitle}
          </p>
        </div>
        <div className="space-y-1 text-[13px] leading-relaxed text-white/44">
          <p>{loadingSearch}</p>
          <p>{loadingVisit}</p>
          <p>{loadingAnswer}</p>
        </div>
      </div>
    </div>
  );
}
