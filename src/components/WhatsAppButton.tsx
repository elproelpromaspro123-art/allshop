"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUp,
  Bot,
  ExternalLink,
  Globe,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_CHAT_CONTEXT_CHARS,
  buildChatCarryoverSummary,
  calculateChatContextUsage,
  createChatSession,
  sanitizeStoredChatSession,
  type ChatSessionMessage,
  type ChatSessionState,
} from "@/lib/chatbot-session";
import { WHATSAPP_PHONE } from "@/lib/site";
import { useLanguage } from "@/providers/LanguageProvider";
import { AssistantActionCard } from "@/components/chatbot/AssistantActionCard";
import { AssistantMarkdown } from "@/components/chatbot/AssistantMarkdown";
import { AssistantThinkingCard } from "@/components/chatbot/AssistantThinkingCard";
import { AssistantWelcome } from "@/components/chatbot/AssistantWelcome";
import type { AssistantAction, ChatResponse } from "@/lib/chatbot-types";

const LEGACY_MESSAGES_STORAGE_KEY = "vortixy_support_assistant_messages";
const SESSION_STORAGE_KEY = "vortixy_support_assistant_session_v2";
const AGENT_MODE_STORAGE_KEY = "vortixy_support_assistant_agent_mode";
const PENDING_ASSISTANT_ACTION_KEY = "vortixy_support_assistant_pending_action";
const USER_MESSAGE_MAX_CHARS = 3000;

type ChatMessage = ChatSessionMessage;

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

function parseLegacyMessages(value: string | null): ChatMessage[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as Partial<ChatMessage>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((message): ChatMessage | null => {
        const role =
          message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
        const content = String(message.content || "").trim().slice(0, USER_MESSAGE_MAX_CHARS);

        if (!role || !content) {
          return null;
        }

        return {
          id: String(message.id || "").trim() || crypto.randomUUID(),
          role,
          content,
          action: message.action || null,
          actionExecuted: Boolean(message.actionExecuted),
          tools: Array.isArray(message.tools)
            ? message.tools.filter((tool) => typeof tool === "string")
            : [],
          sources: Array.isArray(message.sources)
            ? (message.sources.filter(Boolean) as ChatMessage["sources"])
            : [],
        };
      })
      .filter((message): message is ChatMessage => Boolean(message));
  } catch {
    return [];
  }
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [session, setSession] = useState<ChatSessionState>(() => createChatSession());
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentModeEnabled, setAgentModeEnabled] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showContextLimitNotice, setShowContextLimitNotice] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isCheckout = pathname === "/checkout";
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pendingAutoActionIdRef = useRef<string | null>(null);
  const messages = session.messages;

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 48), 132);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 132 ? "auto" : "hidden";
  }, []);

  const updateMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setSession((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      messages: updater(prev.messages),
    }));
  }, []);

  useEffect(() => {
    try {
      const storedSession = sanitizeStoredChatSession(localStorage.getItem(SESSION_STORAGE_KEY));
      if (storedSession) {
        setSession(storedSession);
      } else {
        const legacyMessages = parseLegacyMessages(localStorage.getItem(LEGACY_MESSAGES_STORAGE_KEY));
        setSession(
          legacyMessages.length
            ? createChatSession({ messages: legacyMessages })
            : createChatSession()
        );
      }
      setAgentModeEnabled(localStorage.getItem(AGENT_MODE_STORAGE_KEY) === "1");
    } catch {
      setSession(createChatSession());
      setAgentModeEnabled(false);
    } finally {
      setSessionHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionHydrated) {
      return;
    }

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.removeItem(LEGACY_MESSAGES_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }, [session, sessionHydrated]);

  useEffect(() => {
    try {
      localStorage.setItem(AGENT_MODE_STORAGE_KEY, agentModeEnabled ? "1" : "0");
    } catch {
      // ignore storage failures
    }
  }, [agentModeEnabled]);

  const contextUsage = useMemo(
    () =>
      calculateChatContextUsage({
        messages,
        carryoverSummary: session.carryoverSummary,
      }),
    [messages, session.carryoverSummary]
  );

  const projectedContextUsage = useMemo(() => {
    const nextDraft = draft.trim();

    if (!nextDraft) {
      return contextUsage;
    }

    return calculateChatContextUsage({
      messages: [...messages, { role: "user", content: nextDraft }],
      carryoverSummary: session.carryoverSummary,
    });
  }, [contextUsage, draft, messages, session.carryoverSummary]);

  const contextWouldOverflow = Boolean(draft.trim()) && projectedContextUsage.isLimitReached;
  const limitNoticeVisible =
    contextUsage.isLimitReached || showContextLimitNotice || contextWouldOverflow;
  const limitUsage = contextWouldOverflow ? projectedContextUsage : contextUsage;
  const canSubmit =
    Boolean(draft.trim()) && !loading && !contextUsage.isLimitReached && !contextWouldOverflow;
  const contextMeterTitle = useMemo(
    () =>
      `Contexto actual: ${contextUsage.used}/${contextUsage.max} caracteres. Queda ${contextUsage.percentRemaining}% disponible.`,
    [contextUsage.max, contextUsage.percentRemaining, contextUsage.used]
  );

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
  const startNewConversation = useCallback(
    (withSummary: boolean) => {
      const carryoverSummary = withSummary
        ? buildChatCarryoverSummary(messages) || session.carryoverSummary || null
        : null;

      setSession(createChatSession({ carryoverSummary }));
      setShowContextLimitNotice(false);
      setLoading(false);
      setActionBusyId(null);
      setHasInteracted(true);
      setOpen(true);
      setExpanded(false);
      setDraft("");
      setError(null);
      pendingAutoActionIdRef.current = null;

      try {
        sessionStorage.removeItem(PENDING_ASSISTANT_ACTION_KEY);
      } catch {
        // ignore storage failures
      }
    },
    [messages, session.carryoverSummary]
  );

  const resetConversation = useCallback(() => {
    startNewConversation(false);
  }, [startNewConversation]);

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
    setLoading(false);
    setError(null);
    setActionBusyId(null);
    pendingAutoActionIdRef.current = null;
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

  const markActionExecuted = useCallback((messageId: string) => {
    updateMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, actionExecuted: true } : message
      )
    );
  }, [updateMessages]);

  const executeAssistantAction = useCallback(
    (messageId: string, action: AssistantAction, enableAgentMode = false) => {
      if (enableAgentMode) {
        setAgentModeEnabled(true);
      }

      pendingAutoActionIdRef.current = null;
      setActionBusyId(messageId);
      markActionExecuted(messageId);
      setOpen(true);
      setExpanded(false);
      setError(null);

      if (typeof window === "undefined") {
        setActionBusyId(null);
        return;
      }

      const targetHash = action.sectionId ? `#${action.sectionId}` : "";
      const targetHref = `${action.path}${targetHash}`;

      if (window.location.pathname !== action.path) {
        try {
          sessionStorage.setItem(PENDING_ASSISTANT_ACTION_KEY, JSON.stringify(action));
        } catch {
          // ignore storage failures
        }

        router.push(targetHref);
        window.setTimeout(() => setActionBusyId(null), 900);
        return;
      }

      if (action.sectionId) {
        const targetNode = document.getElementById(action.sectionId);
        if (targetNode) {
          targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.location.hash = action.sectionId;
        }
      } else {
        router.push(targetHref);
      }

      window.setTimeout(() => setActionBusyId(null), 300);
    },
    [markActionExecuted, router]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let pendingAction: AssistantAction | null = null;

    try {
      const rawValue = sessionStorage.getItem(PENDING_ASSISTANT_ACTION_KEY);
      pendingAction = rawValue ? (JSON.parse(rawValue) as AssistantAction) : null;
    } catch {
      pendingAction = null;
    }

    if (!pendingAction || pendingAction.path !== pathname) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (pendingAction?.sectionId) {
        const targetNode = document.getElementById(pendingAction.sectionId);
        if (targetNode) {
          targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.location.hash = pendingAction.sectionId;
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      try {
        sessionStorage.removeItem(PENDING_ASSISTANT_ACTION_KEY);
      } catch {
        // ignore storage failures
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!agentModeEnabled || actionBusyId) {
      return;
    }

    const latestAssistantMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.id === pendingAutoActionIdRef.current &&
          message.role === "assistant" &&
          message.action &&
          !message.actionExecuted
      );

    if (!latestAssistantMessage?.action) {
      return;
    }

    executeAssistantAction(latestAssistantMessage.id, latestAssistantMessage.action);
  }, [actionBusyId, agentModeEnabled, executeAssistantAction, messages]);

  const sendMessage = useCallback(
    async (preset?: string) => {
      const content = (preset ?? draft).trim();
      if (!content || loading) return;

      const projectedUsage = calculateChatContextUsage({
        messages: [...messages, { role: "user", content }],
        carryoverSummary: session.carryoverSummary,
      });

      if (projectedUsage.isLimitReached) {
        setShowContextLimitNotice(true);
        setOpen(true);
        setHasInteracted(true);
        setError(null);
        return;
      }

      const conversation = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "user" as const,
          content: content.slice(0, USER_MESSAGE_MAX_CHARS),
        },
      ];

      updateMessages(() => conversation);
      setDraft("");
      setError(null);
      setShowContextLimitNotice(false);
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
            agentModeEnabled,
            conversationSummary: session.carryoverSummary || "",
            pageTitle: typeof document !== "undefined" ? document.title : "",
            pageUrl: typeof window !== "undefined" ? window.location.href : "",
          }),
        });

        const data = (await response.json()) as ChatResponse;
        if (!response.ok || !data.answer) {
          throw new Error(data.error || t("assistant.errorFallback"));
        }

        updateMessages((prev) => {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer || "",
            action: data.action || null,
            actionExecuted: false,
            tools: Array.isArray(data.tools) ? data.tools : [],
            sources: Array.isArray(data.sources) ? data.sources : [],
          };

          pendingAutoActionIdRef.current = assistantMessage.action ? assistantMessage.id : null;
          return [...prev, assistantMessage];
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
    [agentModeEnabled, draft, loading, messages, session.carryoverSummary, t, updateMessages]
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
             "bg-[linear-gradient(180deg,rgba(6,18,13,0.24),rgba(6,18,13,0.1)),linear-gradient(145deg,var(--emerald-panel-strong)_0%,var(--emerald-panel-mid)_58%,var(--emerald-panel-soft)_100%)]",
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

             <div className="flex items-center gap-2">
               <div
                 title={contextMeterTitle}
                 className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.06] px-2.5 text-white/78"
               >
                 <span className="relative flex h-7 w-7 items-center justify-center">
                   <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
                     <circle
                       cx="18"
                       cy="18"
                       r="15.5"
                       fill="none"
                       stroke="rgba(255,255,255,0.12)"
                       strokeWidth="2.6"
                     />
                     <circle
                       cx="18"
                       cy="18"
                       r="15.5"
                       fill="none"
                       pathLength="100"
                       stroke={contextUsage.isLimitReached ? "#fca5a5" : "#86efac"}
                       strokeDasharray="100"
                       strokeDashoffset={100 - contextUsage.percentUsed}
                       strokeLinecap="round"
                       strokeWidth="2.8"
                     />
                   </svg>
                   <span className="absolute text-[9px] font-semibold leading-none text-white/88">
                     {contextUsage.percentUsed}
                   </span>
                 </span>
                 <span className="hidden min-w-0 sm:block">
                   <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/42">
                     Contexto
                   </span>
                   <span
                     className={cn(
                       "block text-[11px] font-semibold leading-none",
                       contextUsage.isLimitReached ? "text-red-200" : "text-white/88"
                     )}
                   >
                     {contextUsage.used}/{MAX_CHAT_CONTEXT_CHARS}
                   </span>
                 </span>
               </div>
               <button
                 onClick={resetConversation}
                 className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.08] px-2.5 text-[11px] font-semibold text-white/88 shadow-[0_10px_28px_rgba(6,24,18,0.16)] transition-all hover:border-white/[0.22] hover:bg-white/[0.12] sm:px-3"
               >
                 <MessageSquarePlus className="h-3.5 w-3.5" />
                 <span className="hidden sm:inline">{t("assistant.newChat")}</span>
                 <span className="sm:hidden">Nueva</span>
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
               <div className="space-y-4">
                 {session.carryoverSummary ? (
                   <div className="mx-auto max-w-md rounded-[1.15rem] border border-emerald-200/18 bg-emerald-400/10 px-4 py-3 text-center text-[12px] text-emerald-50/88">
                     Resumen de la conversacion anterior cargado. Puedes seguir desde aqui sin perder el hilo.
                   </div>
                 ) : null}
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
               </div>
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

                           {message.action ? (
                             <AssistantActionCard
                               action={message.action}
                               agentModeEnabled={agentModeEnabled}
                               busy={actionBusyId === message.id}
                               executed={Boolean(message.actionExecuted)}
                               onApprove={() => executeAssistantAction(message.id, message.action!)}
                               onActivateAgent={() =>
                                 executeAssistantAction(message.id, message.action!, true)
                               }
                               activateAgentLabel={t("assistant.actionActivateAgent")}
                               approveLabel={t("assistant.actionApprove")}
                               autoModeLabel={t("assistant.actionAutoMode")}
                               executedLabel={t("assistant.actionExecuted")}
                               runAgainLabel={t("assistant.actionRunAgain")}
                             />
                           ) : null}

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

             {limitNoticeVisible ? (
               <div className="mb-3 rounded-[1.35rem] border border-amber-200/18 bg-amber-500/10 px-3.5 py-3 text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                 <p className="text-[12px] font-semibold text-amber-50">
                   Limite de texto alcanzado porfavor crear otra conversacion
                 </p>
                 <p className="mt-1 text-[11px] leading-relaxed text-amber-50/78">
                   Contexto usado: {limitUsage.used}/{limitUsage.max}. Espacio restante:{" "}
                   {limitUsage.percentRemaining}%.
                 </p>
                 <div className="mt-3 flex flex-wrap gap-2">
                   <button
                     type="button"
                     onClick={() => startNewConversation(false)}
                     className="inline-flex items-center rounded-full border border-white/14 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold text-white/88 transition-colors hover:bg-white/[0.12]"
                   >
                     Nueva charla sin resumen
                   </button>
                   <button
                     type="button"
                     onClick={() => startNewConversation(true)}
                     className="inline-flex items-center rounded-full border border-emerald-200/24 bg-emerald-400/14 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 transition-colors hover:bg-emerald-400/20"
                   >
                     Nueva charla con resumen
                   </button>
                 </div>
               </div>
             ) : null}

             <div className="rounded-[1.35rem] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.024))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-white/[0.2] focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]">
               <div className="flex items-end gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3">
                 <textarea
                   data-vortixy-chat-input="true"
                   ref={textareaRef}
                   value={draft}
                   disabled={contextUsage.isLimitReached}
                   onChange={(event) => {
                     setDraft(event.target.value.slice(0, USER_MESSAGE_MAX_CHARS));
                     if (!contextUsage.isLimitReached) {
                       setShowContextLimitNotice(false);
                     }
                   }}
                   onKeyDown={(event) => {
                     if (event.key === "Enter" && !event.shiftKey) {
                       event.preventDefault();
                       void sendMessage();
                     }
                   }}
                   placeholder={
                     contextUsage.isLimitReached
                       ? "Limite de texto alcanzado porfavor crear otra conversacion"
                       : t("assistant.placeholder")
                   }
                   rows={1}
                   className="hide-scrollbar min-h-[48px] max-h-[132px] flex-1 resize-none overflow-y-hidden bg-transparent py-1.5 text-[13px] leading-[1.45] text-white placeholder:text-white/28 disabled:cursor-not-allowed disabled:text-white/34 disabled:placeholder:text-white/26 focus:outline-none focus-visible:outline-none"
                 />
                 <button
                   onClick={() => void sendMessage()}
                   disabled={!canSubmit}
                   aria-label={t("assistant.send")}
                   className={cn(
                     "mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border transition-all",
                     canSubmit
                       ? "border-emerald-400/40 bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.24)] hover:bg-emerald-400"
                       : "border-white/[0.06] bg-white/[0.03] text-white/20"
                   )}
                 >
                   <ArrowUp className="h-4 w-4" />
                 </button>
               </div>
             </div>

             {/* Bottom bar: WA link + agent mode */}
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
                 aria-checked={agentModeEnabled}
                 onClick={() => setAgentModeEnabled((prev) => !prev)}
                 className={cn(
                   "inline-flex min-w-[11.5rem] items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition-all duration-200",
                   agentModeEnabled
                     ? "border-emerald-300/55 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(52,211,153,0.18))] text-white shadow-[0_0_0_1px_rgba(74,222,128,0.24),0_16px_32px_rgba(16,185,129,0.22)]"
                     : "border-white/[0.06] bg-white/[0.03] text-white/48 hover:border-white/[0.12] hover:bg-white/[0.05]"
                 )}
               >
                 <span className="flex min-w-0 items-center gap-2.5">
                   <span
                     className={cn(
                       "inline-flex h-2.5 w-2.5 shrink-0 rounded-full transition-all",
                       agentModeEnabled
                         ? "bg-emerald-200 shadow-[0_0_0_4px_rgba(167,243,208,0.14)]"
                         : "bg-white/28"
                     )}
                   />
                   <span className="min-w-0">
                     <span className="block text-[11px] font-semibold text-inherit">
                       {t("assistant.agentModeTitle")}
                     </span>
                     <span
                       className={cn(
                         "block text-[10px] leading-none",
                         agentModeEnabled ? "text-emerald-50/90" : "text-white/38"
                       )}
                     >
                       {agentModeEnabled
                         ? t("assistant.deepModeEnabled")
                         : t("assistant.deepModeDisabled")}
                     </span>
                   </span>
                 </span>

                 <span className="flex items-center gap-2">
                   {agentModeEnabled ? (
                     <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                       ON
                     </span>
                   ) : null}
                   <span
                     className={cn(
                       "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                       agentModeEnabled ? "bg-emerald-500/90" : "bg-white/[0.08]"
                     )}
                   >
                     <span
                       className={cn(
                         "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                         agentModeEnabled ? "translate-x-4" : "translate-x-0.5"
                       )}
                     />
                   </span>
                 </span>
               </button>
              </div>

             <p
               className={cn(
                 "mt-2 text-[11px] leading-relaxed",
                 agentModeEnabled ? "text-emerald-100/78" : "text-white/32"
               )}
             >
               {t("assistant.agentModeHint")}
             </p>
           </div>
          </div>
        </div>
      )}
    </>
  );
}
