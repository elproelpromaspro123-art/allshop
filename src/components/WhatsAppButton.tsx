"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowUp,
  Bot,
  ExternalLink,
  Globe,
  Maximize2,
  Minimize2,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WHATSAPP_PHONE } from "@/lib/site";
import { useLanguage } from "@/providers/LanguageProvider";
import { AssistantMarkdown } from "@/components/chatbot/AssistantMarkdown";
import { AssistantThinkingCard } from "@/components/chatbot/AssistantThinkingCard";
import { AssistantWelcome } from "@/components/chatbot/AssistantWelcome";

const STORAGE_KEY = "vortixy_support_assistant_messages";
const MAX_STORED_MESSAGES = 12;

interface ChatSource {
  title: string;
  url: string;
  snippet?: string;
  liveViewUrl?: string;
  type: "search" | "browser";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  sources?: ChatSource[];
}

interface ChatResponse {
  answer?: string;
  tools?: string[];
  sources?: ChatSource[];
  error?: string;
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function getToolMeta(tool: string) {
  switch (tool) {
    case "web_search":
      return { label: "Web en vivo", Icon: Search };
    case "visit_website":
      return { label: "Páginas verificadas", Icon: Globe };
    case "browser_automation":
      return { label: "Navegación guiada", Icon: Sparkles };
    case "code_interpreter":
      return { label: "Análisis estructurado", Icon: Shield };
    default:
      return { label: tool.replace(/_/g, " "), Icon: Sparkles };
  }
}

function parseStoredMessages(value: string | null): ChatMessage[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (message) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0
      )
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [browserAutomationAllowed, setBrowserAutomationAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 48), 132);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 132 ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    try {
      setMessages(parseStoredMessages(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    try {
      if (!messages.length) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
      }
    } catch {
      // ignore storage failures
    }
  }, [messages]);

  const quickPrompts = useMemo(() => {
    if (pathname.startsWith("/checkout")) {
      return [t("assistant.promptReviewOrder"), t("assistant.promptPayment"), t("assistant.promptAddress")];
    }

    if (pathname.startsWith("/producto/")) {
      return [t("assistant.promptExplainProduct"), t("assistant.promptCompareProduct"), t("assistant.promptDelivery")];
    }

    if (pathname.startsWith("/seguimiento") || pathname.startsWith("/soporte")) {
      return [t("assistant.promptTracking"), t("assistant.promptSupport"), t("assistant.promptShipping")];
    }

    return [t("assistant.promptRecommend"), t("assistant.promptHelpChoose"), t("assistant.promptShipping")];
  }, [pathname, t]);

  const latestUserMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "user")?.content || "",
    [messages]
  );

  const waUrl = useMemo(() => {
    const pageContext = typeof window !== "undefined" ? window.location.href : pathname;
    const rawMessage = [
      t("assistant.whatsappGreeting"),
      latestUserMessage ? `Consulta: ${latestUserMessage.slice(0, 220)}` : null,
      pageContext ? `Página: ${pageContext}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(rawMessage)}`;
  }, [latestUserMessage, pathname, t]);
  const shouldBlockPage = open && (expanded || isMobileViewport);

  const close = useCallback(() => {
    setOpen(false);
    setExpanded(false);
  }, []);
  const resetConversation = useCallback(() => {
    setMessages([]);
    setDraft("");
    setError(null);
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setHasInteracted(true);
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  useEffect(() => {
    document.body.style.overflow = shouldBlockPage ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [pathname, shouldBlockPage]);

  useEffect(() => {
    setOpen(false);
    setExpanded(false);
    setLoading(false);
    setError(null);
  }, [pathname]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 140);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    syncTextareaHeight();
  }, [draft, open, expanded, syncTextareaHeight]);

  useEffect(() => {
    const onOpenAssistant = (event: Event) => {
      setOpen(true);
      setExpanded(false);
      setHasInteracted(true);

      const detail = event instanceof CustomEvent ? event.detail : null;
      if (detail && typeof detail.prompt === "string") {
        setDraft(detail.prompt.slice(0, 280));
      }
    };

    window.addEventListener("vortixy:assistant-open", onOpenAssistant as EventListener);
    return () => {
      window.removeEventListener("vortixy:assistant-open", onOpenAssistant as EventListener);
    };
  }, []);

  const sendMessage = useCallback(
    async (preset?: string) => {
      const content = (preset ?? draft).trim();
      if (!content || loading) return;

      const conversation = [
        ...messages,
        { id: crypto.randomUUID(), role: "user" as const, content: content.slice(0, 3000) },
      ].slice(-MAX_STORED_MESSAGES);

      setMessages(conversation);
      setDraft("");
      setError(null);
      setLoading(true);
      setOpen(true);
      setHasInteracted(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conversation.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            browserAutomationAllowed,
            pageTitle: typeof document !== "undefined" ? document.title : "",
            pageUrl: typeof window !== "undefined" ? window.location.href : "",
          }),
        });

        const data = (await response.json()) as ChatResponse;
        if (!response.ok || !data.answer) {
          throw new Error(data.error || t("assistant.errorFallback"));
        }

        setMessages((prev) => {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer || "",
            tools: Array.isArray(data.tools) ? data.tools : [],
            sources: Array.isArray(data.sources) ? data.sources : [],
          };

          return [...prev, assistantMessage].slice(-MAX_STORED_MESSAGES);
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error && requestError.message
            ? requestError.message
            : t("assistant.errorFallback")
        );
      } finally {
        setLoading(false);
      }
    },
    [browserAutomationAllowed, draft, loading, messages, t]
  );

  return (
    <>
      <button
        onClick={toggleOpen}
        aria-label={t("assistant.open")}
        className={cn(
          "fixed right-5 sm:right-6 z-[55]",
          isCheckout ? "bottom-24" : "bottom-5 sm:bottom-6",
          "group flex items-center gap-2.5 rounded-full border border-emerald-500/20 px-4 py-3 text-white",
          "bg-[linear-gradient(135deg,#008f58_0%,#00b76f_55%,#00d482_100%)] shadow-[var(--shadow-whatsapp)]",
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-whatsapp-hover)] active:scale-[0.98]"
        )}
      >
        {!hasInteracted ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 animate-subtle-pulse">
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
          </span>
        ) : null}

        <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15">
          <Bot className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white/30 bg-[#1a583a] p-1 text-[#e8fff4]">
            <WaIcon className="h-2.5 w-2.5" />
          </span>
        </span>

        <span className="hidden min-w-0 sm:block">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/74">
            {t("assistant.badge")}
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-none">
            {t("assistant.launcher")}
          </span>
        </span>
      </button>

      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[72] flex",
            shouldBlockPage
              ? expanded
                ? "items-stretch justify-center p-0 sm:items-center sm:p-4"
                : "items-end justify-end p-0 sm:p-4"
              : "pointer-events-none items-end justify-end p-4 sm:p-5"
          )}
          role="dialog"
          aria-modal={shouldBlockPage || undefined}
          aria-label={t("assistant.modalLabel")}
        >
          <div
            className={cn(
              "absolute inset-0 animate-[fade-in_180ms_ease-out] transition-opacity duration-200",
              shouldBlockPage
                ? "pointer-events-auto bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_28%),rgba(8,16,14,0.72)] backdrop-blur-md opacity-100"
                : "pointer-events-none opacity-0"
            )}
            onClick={close}
          />

          <div
           data-vortixy-chat-panel="true"
           className={cn(
             "pointer-events-auto relative z-[1] flex w-full flex-col overflow-hidden text-white animate-[fade-in-up_240ms_ease-out]",
             "bg-[linear-gradient(180deg,rgba(6,18,13,0.18),rgba(6,18,13,0.06)),linear-gradient(145deg,var(--emerald-panel-strong)_0%,var(--emerald-panel-mid)_58%,var(--emerald-panel-soft)_100%)]",
             "h-[100dvh] rounded-none border-0",
             expanded
               ? "sm:h-[calc(100dvh-2rem)] sm:max-w-[min(90vw,64rem)] sm:rounded-2xl sm:border sm:border-white/[0.08] sm:shadow-2xl"
               : "sm:h-[min(82vh,46rem)] sm:max-w-[29rem] sm:rounded-[1.7rem] sm:border sm:border-white/[0.08] sm:shadow-[0_24px_80px_rgba(10,15,30,0.20)]"
           )}
          >
           {/* ── Header ── */}
           <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4 sm:px-5">
             <div className="flex items-center gap-3">
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                 <Bot className="h-4 w-4" />
               </div>
               <div>
                 <p className="text-[13px] font-semibold leading-none text-white/90">{t("assistant.title")}</p>
                 <p className="mt-1 text-[11px] leading-none text-white/35">{t("assistant.subtitle")}</p>
               </div>
             </div>

             <div className="flex items-center gap-1">
               <button
                 onClick={resetConversation}
                 className="hidden h-7 items-center rounded-lg px-2.5 text-[11px] font-medium text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70 sm:inline-flex"
               >
                 {t("assistant.newChat")}
               </button>
               <button
                 onClick={() => setExpanded((prev) => !prev)}
                 aria-label={expanded ? t("assistant.collapse") : t("assistant.expand")}
                 className="hidden h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/60 sm:inline-flex"
               >
                 {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
               </button>
               <button
                 onClick={close}
                 aria-label={t("common.close")}
                 className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/60"
               >
                 <X className="h-3.5 w-3.5" />
               </button>
             </div>
           </div>

           {/* ── Messages ── */}
           <div
             ref={scrollRef}
             className={cn(
               "flex-1 overflow-y-auto overscroll-contain",
               expanded ? "px-6 py-6 lg:px-10" : "px-4 pb-6 pt-5 sm:px-5 sm:pb-5"
             )}
           >
             {!messages.length ? (
               <AssistantWelcome
                 compact={!expanded}
                 eyebrow={t("assistant.welcomeEyebrow")}
                 title={t("assistant.welcomeTitle")}
                 body={t("assistant.welcomeBody")}
                 startersLabel={t("assistant.starters")}
                 prompts={quickPrompts}
                 onPrompt={(prompt) => void sendMessage(prompt)}
                 featureResearchTitle={t("assistant.featureResearchTitle")}
                 featureResearchBody={t("assistant.featureResearchBody")}
                 featureClarityTitle={t("assistant.featureClarityTitle")}
                 featureClarityBody={t("assistant.featureClarityBody")}
                 featureHandoffTitle={t("assistant.featureHandoffTitle")}
                 featureHandoffBody={t("assistant.featureHandoffBody")}
               />
             ) : (
               <div className={cn(
                 "mx-auto space-y-6",
                 expanded ? "max-w-2xl" : "max-w-full"
               )}>
                 {messages.map((message) => {
                   const isAssistant = message.role === "assistant";
                   return (
                     <div key={message.id} className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
                       {isAssistant ? (
                         <div className="max-w-[90%] space-y-1 pl-1">
                           <AssistantMarkdown content={message.content} />

                           {((message.tools?.length || 0) > 0 || (message.sources?.length || 0) > 0) ? (
                             <div className="mt-4 space-y-2.5 border-t border-white/[0.04] pt-3">
                               {(message.tools?.length || 0) > 0 ? (
                                 <div className="flex flex-wrap gap-1.5">
                                   {message.tools?.map((tool) => {
                                     const { Icon, label } = getToolMeta(tool);
                                     return (
                                       <span key={tool} className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-white/40">
                                         <Icon className="h-3 w-3" />
                                         {label}
                                       </span>
                                     );
                                   })}
                                 </div>
                               ) : null}

                               {(message.sources?.length || 0) > 0 ? (
                                 <div className="flex flex-wrap gap-1.5">
                                   {message.sources?.map((source) => (
                                     <a
                                       key={`${source.type}:${source.url}`}
                                       href={source.liveViewUrl || source.url}
                                       target="_blank"
                                       rel="noreferrer"
                                       className="group inline-flex max-w-full items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/60"
                                       title={source.snippet || source.title}
                                     >
                                       <span className="truncate">{source.title}</span>
                                       <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                     </a>
                                   ))}
                                 </div>
                               ) : null}
                             </div>
                           ) : null}
                         </div>
                       ) : (
                         <div className="max-w-[80%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-white">
                           <p className="text-[13px] leading-relaxed">{message.content}</p>
                         </div>
                       )}
                     </div>
                   );
                 })}

                 {loading ? (
                   <AssistantThinkingCard
                     loadingTitle={t("assistant.loadingTitle")}
                     loadingSearch={t("assistant.loadingSearch")}
                     loadingVisit={t("assistant.loadingVisit")}
                     loadingAnswer={t("assistant.loadingAnswer")}
                   />
                 ) : null}
               </div>
             )}
           </div>

           {/* ── Footer ── */}
           <div className="border-t border-white/[0.08] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-5 sm:pb-4">
             {error ? (
               <div className="mb-2.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-200/80">
                 {error}
               </div>
             ) : null}

             <div className="rounded-[1.35rem] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.024))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-white/[0.2] focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
               <div className="flex items-end gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3">
                 <textarea
                   data-vortixy-chat-input="true"
                   ref={textareaRef}
                   value={draft}
                   onChange={(event) => {
                     setDraft(event.target.value.slice(0, 3000));
                   }}
                   onKeyDown={(event) => {
                     if (event.key === "Enter" && !event.shiftKey) {
                       event.preventDefault();
                       void sendMessage();
                     }
                   }}
                   placeholder={t("assistant.placeholder")}
                   rows={1}
                   className="hide-scrollbar min-h-[48px] max-h-[132px] flex-1 resize-none overflow-y-hidden bg-transparent py-1.5 text-[13px] leading-[1.45] text-white placeholder:text-white/28 focus:outline-none focus-visible:outline-none"
                 />
                 <button
                   onClick={() => void sendMessage()}
                   disabled={!draft.trim() || loading}
                   aria-label={t("assistant.send")}
                   className={cn(
                     "mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border transition-all",
                     draft.trim() && !loading
                       ? "border-emerald-400/40 bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.24)] hover:bg-emerald-400"
                       : "border-white/[0.06] bg-white/[0.03] text-white/20"
                   )}
                 >
                   <ArrowUp className="h-4 w-4" />
                 </button>
               </div>
             </div>

             {/* Bottom bar: WA link + deep mode */}
             <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 sm:flex-nowrap">
               <a
                 href={waUrl}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/38 transition-colors hover:border-[#25D366]/20 hover:text-[#25D366]/80"
               >
                 <WaIcon className="h-3 w-3" />
                 <span>{t("assistant.handoffButton")}</span>
               </a>

               <button
                 type="button"
                 role="switch"
                 aria-checked={browserAutomationAllowed}
                 onClick={() => setBrowserAutomationAllowed((prev) => !prev)}
                 className={cn(
                   "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-left transition-colors",
                   browserAutomationAllowed
                     ? "border-emerald-400/30 bg-emerald-400/[0.08] text-white/78"
                     : "border-white/[0.06] bg-white/[0.03] text-white/48"
                 )}
               >
                 <span className="text-[11px]">{t("assistant.deepModeTitle")}</span>
                 <span
                   className={cn(
                     "relative inline-flex h-[18px] w-[30px] items-center rounded-full transition-colors",
                     browserAutomationAllowed ? "bg-emerald-500/40" : "bg-white/[0.08]"
                   )}
                 >
                   <span
                     className={cn(
                       "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                       browserAutomationAllowed ? "translate-x-3.5" : "translate-x-0.5"
                     )}
                   />
                 </span>
               </button>
             </div>
           </div>
          </div>
        </div>
      )}
    </>
  );
}
