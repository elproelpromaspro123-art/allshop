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
  ChevronDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_CHAT_CONTEXT_CHARS,
  buildChatCarryoverSummary,
  buildChatSessionTitle,
  calculateChatContextUsage,
  createChatSession,
  createChatSessionStore,
  getChatSessionById,
  sanitizeStoredChatSessionStore,
  upsertChatSessionStore,
  type ChatSessionMessage,
  type ChatSessionState,
  type ChatSessionStore,
} from "@/lib/chatbot-session";
import { WHATSAPP_PHONE } from "@/lib/site";
import { useLanguage } from "@/providers/LanguageProvider";
import { AssistantActionCard } from "@/components/chatbot/AssistantActionCard";
import { AssistantMarkdown } from "@/components/chatbot/AssistantMarkdown";
import { AssistantThinkingCard } from "@/components/chatbot/AssistantThinkingCard";
import { AssistantWelcome } from "@/components/chatbot/AssistantWelcome";
import { useToast } from "@/components/ui/Toast";
import { useCartStore } from "@/store/cart";
import type { AssistantAction, ChatResponse } from "@/lib/chatbot-types";

const LEGACY_MESSAGES_STORAGE_KEY = "vortixy_support_assistant_messages";
const SESSION_STORAGE_KEY = "vortixy_support_assistant_session_v2";
const AGENT_MODE_STORAGE_KEY = "vortixy_support_assistant_agent_mode";
const PENDING_ASSISTANT_ACTION_KEY = "vortixy_support_assistant_pending_action";
const USER_MESSAGE_MAX_CHARS = 3000;

type ChatMessage = ChatSessionMessage;

function WaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
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
          message.role === "assistant"
            ? "assistant"
            : message.role === "user"
              ? "user"
              : null;
        const content = String(message.content || "")
          .trim()
          .slice(0, USER_MESSAGE_MAX_CHARS);

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [sessionStore, setSessionStore] = useState<ChatSessionStore>(() =>
    createChatSessionStore(),
  );
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
  const { toast } = useToast();
  const addCartItem = useCartStore((store) => store.addItem);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pendingAutoActionIdRef = useRef<string | null>(null);
  const session = (getChatSessionById(
    sessionStore,
    sessionStore.activeSessionId,
  ) || sessionStore.sessions[0]) as ChatSessionState;
  const messages = session.messages;

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 44), 124);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 124 ? "auto" : "hidden";
  }, []);

  const updateSessionById = useCallback(
    (
      sessionId: string,
      updater: (prev: ChatSessionState) => ChatSessionState,
      options?: { preserveActiveSession?: boolean },
    ) => {
      setSessionStore((prev) => {
        const currentSession =
          prev.sessions.find((entry) => entry.id === sessionId) ||
          createChatSession();
        const nextSession = {
          ...updater(currentSession),
          updatedAt: new Date().toISOString(),
        };

        return upsertChatSessionStore(
          prev,
          nextSession,
          options?.preserveActiveSession === false
            ? nextSession.id
            : prev.activeSessionId,
        );
      });
    },
    [],
  );

  const updateActiveSession = useCallback(
    (updater: (prev: ChatSessionState) => ChatSessionState) => {
      setSessionStore((prev) => {
        const currentSession =
          getChatSessionById(prev, prev.activeSessionId) ||
          prev.sessions[0] ||
          createChatSession();
        const nextSession = {
          ...updater(currentSession),
          updatedAt: new Date().toISOString(),
        };

        return upsertChatSessionStore(prev, nextSession, nextSession.id);
      });
    },
    [],
  );

  useEffect(() => {
    try {
      const storedSessionStore = sanitizeStoredChatSessionStore(
        localStorage.getItem(SESSION_STORAGE_KEY),
      );
      if (storedSessionStore) {
        setSessionStore(storedSessionStore);
      } else {
        const legacyMessages = parseLegacyMessages(
          localStorage.getItem(LEGACY_MESSAGES_STORAGE_KEY),
        );
        setSessionStore(
          createChatSessionStore({
            sessions: legacyMessages.length
              ? [createChatSession({ messages: legacyMessages })]
              : [createChatSession()],
          }),
        );
      }
      setAgentModeEnabled(localStorage.getItem(AGENT_MODE_STORAGE_KEY) === "1");
    } catch {
      setSessionStore(createChatSessionStore());
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
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionStore));
      localStorage.removeItem(LEGACY_MESSAGES_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }, [sessionHydrated, sessionStore]);

  useEffect(() => {
    try {
      localStorage.setItem(
        AGENT_MODE_STORAGE_KEY,
        agentModeEnabled ? "1" : "0",
      );
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
    [messages, session.carryoverSummary],
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

  const contextWouldOverflow =
    Boolean(draft.trim()) && projectedContextUsage.isLimitReached;
  const limitNoticeVisible =
    contextUsage.isLimitReached ||
    showContextLimitNotice ||
    contextWouldOverflow;
  const limitUsage = contextWouldOverflow
    ? projectedContextUsage
    : contextUsage;
  const canSubmit =
    Boolean(draft.trim()) &&
    !loading &&
    !contextUsage.isLimitReached &&
    !contextWouldOverflow;
  const contextMeterTitle = useMemo(
    () =>
      `Contexto actual: ${contextUsage.used}/${contextUsage.max} caracteres. Queda ${contextUsage.percentRemaining}% disponible.`,
    [contextUsage.max, contextUsage.percentRemaining, contextUsage.used],
  );

  const quickPrompts = useMemo(() => {
    if (pathname.startsWith("/checkout")) {
      return [
        t("assistant.promptReviewOrder"),
        t("assistant.promptPayment"),
        t("assistant.promptAddress"),
      ];
    }

    if (pathname.startsWith("/producto/")) {
      return [
        t("assistant.promptExplainProduct"),
        t("assistant.promptCompareProduct"),
        t("assistant.promptDelivery"),
      ];
    }

    if (
      pathname.startsWith("/seguimiento") ||
      pathname.startsWith("/soporte")
    ) {
      return [
        t("assistant.promptTracking"),
        t("assistant.promptSupport"),
        t("assistant.promptShipping"),
      ];
    }

    return [
      t("assistant.promptRecommend"),
      t("assistant.promptHelpChoose"),
      t("assistant.promptShipping"),
    ];
  }, [pathname, t]);

  const latestUserMessage = useMemo(
    () =>
      [...messages].reverse().find((message) => message.role === "user")
        ?.content || "",
    [messages],
  );
  const sessionTimestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
      }),
    [],
  );

  const waUrl = useMemo(() => {
    const pageContext =
      typeof window !== "undefined" ? window.location.href : pathname;
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

  const openConversation = useCallback((sessionId: string) => {
    setSessionStore((prev) =>
      createChatSessionStore({
        activeSessionId: sessionId,
        sessions: prev.sessions,
      }),
    );
    setShowContextLimitNotice(false);
    setLoading(false);
    setActionBusyId(null);
    setOpen(true);
    setExpanded(false);
    setDraft("");
    setError(null);
    pendingAutoActionIdRef.current = null;
  }, []);

  const startNewConversation = useCallback(
    (withSummary: boolean) => {
      const currentSessionHasContent =
        messages.length > 0 || Boolean(session.carryoverSummary);
      const carryoverSummary = withSummary
        ? buildChatCarryoverSummary(messages) ||
          session.carryoverSummary ||
          null
        : null;

      if (!withSummary && !currentSessionHasContent) {
        openConversation(session.id);
      } else {
        const nextSession = createChatSession({ carryoverSummary });
        setSessionStore((prev) =>
          upsertChatSessionStore(prev, nextSession, nextSession.id),
        );
      }

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
    [messages, openConversation, session.carryoverSummary, session.id],
  );

  const resetConversation = useCallback(() => {
    startNewConversation(false);
  }, [startNewConversation]);

  const deleteConversation = useCallback((sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionStore((prev) => {
      const nextSessions = prev.sessions.filter(s => s.id !== sessionId);
      const nextActiveId = prev.activeSessionId === sessionId 
        ? (nextSessions[0]?.id || "") 
        : prev.activeSessionId;
      
      return {
        ...prev,
        activeSessionId: nextActiveId,
        sessions: nextSessions.length ? nextSessions : [createChatSession()]
      };
    });
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

    window.addEventListener(
      "vortixy:assistant-open",
      onOpenAssistant as EventListener,
    );
    return () => {
      window.removeEventListener(
        "vortixy:assistant-open",
        onOpenAssistant as EventListener,
      );
    };
  }, []);

  const markActionExecuted = useCallback(
    (messageId: string) => {
      updateActiveSession((prev) => ({
        ...prev,
        messages: prev.messages.map((message) =>
          message.id === messageId
            ? { ...message, actionExecuted: true }
            : message,
        ),
      }));
    },
    [updateActiveSession],
  );

  const executeAssistantAction = useCallback(
    (messageId: string, action: AssistantAction, enableAgentMode = false) => {
      if (enableAgentMode) {
        setAgentModeEnabled(true);
      }

      pendingAutoActionIdRef.current = null;
      setActionBusyId(messageId);
      setOpen(true);
      setExpanded(false);
      setError(null);

      if (typeof window === "undefined") {
        setActionBusyId(null);
        return;
      }

      if (
        action.type === "add_to_cart" ||
        action.type === "add_to_cart_and_checkout"
      ) {
        addCartItem({
          productId: action.product.productId,
          slug: action.product.slug,
          name: action.product.name,
          price: action.product.price,
          image: action.product.image,
          variant: null,
          quantity: action.quantity || 1,
          freeShipping: action.product.freeShipping,
          shippingCost: action.product.shippingCost,
          stockLocation: action.product.stockLocation,
        });

        toast(
          action.type === "add_to_cart_and_checkout"
            ? "Producto agregado y checkout listo"
            : "Producto agregado al carrito",
          "success",
          action.quantity && action.quantity > 1
            ? `${action.quantity} unidades de ${action.product.name}.`
            : action.product.name,
        );

        markActionExecuted(messageId);

        if (action.type === "add_to_cart_and_checkout") {
          router.push("/checkout");
          window.setTimeout(() => setActionBusyId(null), 900);
          return;
        }

        window.setTimeout(() => setActionBusyId(null), 250);
        return;
      }

      if (action.type !== "navigate") {
        setActionBusyId(null);
        return;
      }

      const navigateAction = action;
      const targetHash = navigateAction.sectionId
        ? `#${navigateAction.sectionId}`
        : "";
      const targetHref = `${navigateAction.path}${targetHash}`;
      markActionExecuted(messageId);

      if (window.location.pathname !== navigateAction.path) {
        try {
          sessionStorage.setItem(
            PENDING_ASSISTANT_ACTION_KEY,
            JSON.stringify(navigateAction),
          );
        } catch {
          // ignore storage failures
        }

        router.push(targetHref);
        window.setTimeout(() => setActionBusyId(null), 900);
        return;
      }

      if (navigateAction.sectionId) {
        const targetNode = document.getElementById(navigateAction.sectionId);
        if (targetNode) {
          targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.location.hash = navigateAction.sectionId;
        }
      } else {
        router.push(targetHref);
      }

      window.setTimeout(() => setActionBusyId(null), 300);
    },
    [addCartItem, markActionExecuted, router, toast],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let pendingAction: AssistantAction | null = null;

    try {
      const rawValue = sessionStorage.getItem(PENDING_ASSISTANT_ACTION_KEY);
      pendingAction = rawValue
        ? (JSON.parse(rawValue) as AssistantAction)
        : null;
    } catch {
      pendingAction = null;
    }

    if (
      !pendingAction ||
      pendingAction.type !== "navigate" ||
      pendingAction.path !== pathname
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (pendingAction.sectionId) {
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
          !message.actionExecuted,
      );

    if (!latestAssistantMessage?.action) {
      return;
    }

    executeAssistantAction(
      latestAssistantMessage.id,
      latestAssistantMessage.action,
    );
  }, [actionBusyId, agentModeEnabled, executeAssistantAction, messages]);

  const sendMessage = useCallback(
    async (preset?: string) => {
      const content = (preset ?? draft).trim();
      if (!content || loading) return;
      const requestSessionId = session.id;

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

      updateSessionById(requestSessionId, (prev) => ({
        ...prev,
        messages: conversation,
      }));
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

        updateSessionById(requestSessionId, (prev) => {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer || "",
            action: data.action || null,
            actionExecuted: false,
            tools: Array.isArray(data.tools) ? data.tools : [],
            sources: Array.isArray(data.sources) ? data.sources : [],
          };

          pendingAutoActionIdRef.current = assistantMessage.action
            ? assistantMessage.id
            : null;
          return {
            ...prev,
            messages: [...prev.messages, assistantMessage],
          };
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error && requestError.message
            ? requestError.message
            : t("assistant.errorFallback"),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      agentModeEnabled,
      draft,
      loading,
      messages,
      session.carryoverSummary,
      session.id,
      t,
      updateSessionById,
    ],
  );

  return (
    <>
      <button
        onClick={toggleOpen}
        aria-label={t("assistant.open")}
        className={cn(
          "fixed right-4 sm:right-6 z-[55]",
          isCheckout ? "bottom-24" : "bottom-4 sm:bottom-6",
          "group flex items-center gap-2 rounded-full border border-emerald-500/18 px-3 py-2.5 text-white",
          "bg-[linear-gradient(135deg,#008f58_0%,#00b76f_55%,#00d482_100%)] shadow-[var(--shadow-whatsapp)]",
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-whatsapp-hover)] active:scale-[0.98]",
        )}
      >
        {!hasInteracted ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 animate-subtle-pulse">
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          </span>
        ) : null}

        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-white/12">
          <Bot className="h-4.5 w-4.5" />
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white/25 bg-[#1a583a] p-0.5 text-[#e8fff4]">
            <WaIcon className="h-2 w-2" />
          </span>
        </span>

        <span className="hidden min-w-0 sm:block">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {t("assistant.badge")}
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold leading-none">
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
              : "pointer-events-none items-end justify-end p-4 sm:p-5",
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
                : "pointer-events-none opacity-0",
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
                : "sm:h-[min(70vh,38rem)] sm:max-w-[24rem] sm:rounded-[1.55rem] sm:border sm:border-white/[0.08] sm:shadow-[0_24px_80px_rgba(10,15,30,0.20)]",
            )}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-none text-white/90 truncate">
                    {t("assistant.title")}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-none text-white/40 truncate">
                    {t("assistant.subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={resetConversation}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-white/[0.12] bg-white/[0.06] px-2 text-[9px] font-semibold text-white/85 transition-all hover:border-white/[0.2] hover:bg-white/[0.1]"
                  title="Nueva conversación"
                >
                  <MessageSquarePlus className="h-3 w-3" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
                <button
                  onClick={() => setExpanded((prev) => !prev)}
                  aria-label={
                    expanded ? t("assistant.collapse") : t("assistant.expand")
                  }
                  className="hidden h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70 sm:inline-flex"
                >
                  {expanded ? (
                    <Minimize2 className="h-3 w-3" />
                  ) : (
                    <Maximize2 className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={close}
                  aria-label={t("common.close")}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ── Compact Chat History Bar ── */}
            <div className="border-b border-white/[0.06] px-2.5 py-1.5 sm:px-3 relative group">
              <div
                className="flex items-center justify-between cursor-pointer rounded-md px-2 py-1 hover:bg-white/[0.03] transition-colors"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="flex items-center gap-1.5 text-white/55 group-hover:text-white/75 transition-colors">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em]">
                    Chats
                  </p>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", dropdownOpen && "rotate-180")} />
                </div>
                <p className="text-[9px] bg-white/8 px-1.5 py-0.5 rounded text-white/45">
                  {sessionStore.sessions.length}
                </p>
              </div>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-20 mx-2.5 mt-1.5 max-h-[40vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-[rgba(8,20,16,0.97)] shadow-2xl backdrop-blur-xl animate-[fade-in-up_140ms_ease-out]">
                  <div className="p-1.5 space-y-0.5">
                    {sessionStore.sessions.map((storedSession) => {
                      const isActiveSession = storedSession.id === session.id;
                      const sessionLabel = buildChatSessionTitle(storedSession);
                      const sessionMeta = storedSession.messages.length > 0
                        ? `${storedSession.messages.length} msgs`
                        : storedSession.carryoverSummary ? "Con resumen" : "Vacío";

                      return (
                        <div
                          key={storedSession.id}
                          className={cn(
                            "group/item flex items-center justify-between gap-2 cursor-pointer rounded-lg px-2.5 py-2 transition-all",
                            isActiveSession
                              ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/20"
                              : "text-white/55 hover:bg-white/[0.05] hover:text-white/85 border border-transparent"
                          )}
                          onClick={() => { openConversation(storedSession.id); setDropdownOpen(false); }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-semibold">
                              {sessionLabel}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[8px] opacity-55">
                              <span>{sessionMeta}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-current" />
                              <span>{sessionTimestampFormatter.format(new Date(storedSession.updatedAt || storedSession.createdAt))}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => deleteConversation(storedSession.id, e)}
                            className="p-1 text-red-400/0 opacity-0 group-hover/item:opacity-100 group-hover/item:text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                            title="Eliminar chat"
                            aria-label="Eliminar chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className={cn(
                "flex-1 overflow-y-auto overscroll-contain",
                expanded
                  ? "px-4 py-4 lg:px-6"
                  : "px-3 pb-3 pt-3 sm:px-3.5 sm:pb-3",
              )}
            >
              {!messages.length ? (
                <div className="space-y-2.5">
                  {session.carryoverSummary ? (
                    <div className="mx-auto max-w-sm rounded-lg border border-emerald-200/15 bg-emerald-400/10 px-3 py-2 text-center text-[10px] text-emerald-50/85">
                      Resumen cargado. Continúa desde aquí.
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
                <div
                  className={cn(
                    "mx-auto space-y-3",
                    expanded ? "max-w-2xl" : "max-w-full",
                  )}
                >
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isAssistant ? "justify-start" : "justify-end",
                        )}
                      >
                        {isAssistant ? (
                          <div className="max-w-[85%] space-y-1.5">
                            <AssistantMarkdown content={message.content} />

                            {message.action ? (
                              <AssistantActionCard
                                action={message.action}
                                agentModeEnabled={agentModeEnabled}
                                busy={actionBusyId === message.id}
                                executed={Boolean(message.actionExecuted)}
                                onApprove={() =>
                                  executeAssistantAction(
                                    message.id,
                                    message.action!,
                                  )
                                }
                                onActivateAgent={() =>
                                  executeAssistantAction(
                                    message.id,
                                    message.action!,
                                    true,
                                  )
                                }
                                activateAgentLabel={t(
                                  "assistant.actionActivateAgent",
                                )}
                                approveLabel={t("assistant.actionApprove")}
                                autoModeLabel={t("assistant.actionAutoMode")}
                                executedLabel={t("assistant.actionExecuted")}
                                runAgainLabel={t("assistant.actionRunAgain")}
                              />
                            ) : null}

                            {(message.tools?.length || 0) > 0 ||
                            (message.sources?.length || 0) > 0 ? (
                              <div className="mt-2 space-y-1.5 border-t border-white/[0.03] pt-2">
                                {(message.tools?.length || 0) > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {message.tools?.map((tool) => {
                                      const { Icon, label } = getToolMeta(tool);
                                      return (
                                        <span
                                          key={tool}
                                          className="inline-flex items-center gap-0.5 rounded bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-white/35"
                                        >
                                          <Icon className="h-2.5 w-2.5" />
                                          {label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                {(message.sources?.length || 0) > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {message.sources?.map((source) => (
                                      <a
                                        key={`${source.type}:${source.url}`}
                                        href={source.liveViewUrl || source.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group inline-flex max-w-full items-center gap-1 rounded bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/55"
                                        title={source.snippet || source.title}
                                      >
                                        <span className="truncate max-w-[140px]">
                                          {source.title}
                                        </span>
                                        <ExternalLink className="h-2 w-2 shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="max-w-[75%] rounded-[0.85rem] rounded-br-sm bg-emerald-600 px-2.5 py-2 text-white">
                            <p className="text-[11px] leading-snug">
                              {message.content}
                            </p>
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
            <div className="border-t border-white/[0.08] px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-3 sm:px-3.5 sm:pb-3">
              {error ? (
                <div className="mb-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-200/80">
                  {error}
                </div>
              ) : null}

              {limitNoticeVisible ? (
                <div className="mb-2 rounded-xl border border-amber-200/15 bg-amber-500/10 px-2.5 py-2 text-white/80">
                  <p className="text-[11px] font-semibold text-amber-50">
                    Límite alcanzado. Crea otra conversación.
                  </p>
                  <p className="mt-0.5 text-[10px] text-amber-50/70">
                    {limitUsage.used}/{limitUsage.max} chars
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => startNewConversation(false)}
                      className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/[0.1]"
                    >
                      Sin resumen
                    </button>
                    <button
                      type="button"
                      onClick={() => startNewConversation(true)}
                      className="inline-flex items-center rounded-full border border-emerald-200/20 bg-emerald-400/12 px-2.5 py-1 text-[10px] font-semibold text-emerald-50 transition-colors hover:bg-emerald-400/18"
                    >
                      Con resumen
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1rem] border border-white/[0.1] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-white/[0.18] focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex items-end gap-2 px-2.5 py-2 sm:px-3">
                  <textarea
                    data-vortixy-chat-input="true"
                    ref={textareaRef}
                    value={draft}
                    disabled={contextUsage.isLimitReached}
                    onChange={(event) => {
                      setDraft(
                        event.target.value.slice(0, USER_MESSAGE_MAX_CHARS),
                      );
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
                        ? "Límite alcanzado. Crea otra conversación"
                        : t("assistant.placeholder")
                    }
                    rows={1}
                    className="hide-scrollbar min-h-[40px] max-h-[100px] flex-1 resize-none overflow-y-hidden bg-transparent py-1 text-[11px] leading-[1.4] text-white placeholder:text-white/25 disabled:cursor-not-allowed disabled:text-white/30 disabled:placeholder:text-white/22 focus:outline-none focus-visible:outline-none"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!canSubmit}
                    aria-label={t("assistant.send")}
                    className={cn(
                      "mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border transition-all",
                      canSubmit
                        ? "border-emerald-400/35 bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
                        : "border-white/[0.05] bg-white/[0.02] text-white/18",
                    )}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom bar: WA link + agent mode */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.05] bg-white/[0.02] px-2 py-1.5 text-[10px] text-white/35 transition-colors hover:border-[#25D366]/15 hover:text-[#25D366]/75"
                >
                  <WaIcon className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{t("assistant.handoffButton")}</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>

                <button
                  type="button"
                  role="switch"
                  aria-checked={agentModeEnabled}
                  onClick={() => setAgentModeEnabled((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all duration-200",
                    agentModeEnabled
                      ? "border-emerald-300/45 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(52,211,153,0.14))] text-white shadow-[0_0_0_1px_rgba(74,222,128,0.18),0_12px_24px_rgba(16,185,129,0.16)]"
                      : "border-white/[0.05] bg-white/[0.02] text-white/42 hover:border-white/[0.1] hover:bg-white/[0.04]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-2 w-2 shrink-0 rounded-full transition-all",
                        agentModeEnabled
                          ? "bg-emerald-200 shadow-[0_0_0_3px_rgba(167,243,208,0.1)]"
                          : "bg-white/25",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold text-inherit">
                        {t("assistant.agentModeTitle")}
                      </span>
                      <span
                        className={cn(
                          "block text-[9px] leading-none",
                          agentModeEnabled
                            ? "text-emerald-50/85"
                            : "text-white/35",
                        )}
                      >
                        {agentModeEnabled
                          ? t("assistant.deepModeEnabled")
                          : t("assistant.deepModeDisabled")}
                      </span>
                    </span>
                  </span>

                  <span
                    className={cn(
                      "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                      agentModeEnabled
                        ? "bg-emerald-500/85"
                        : "bg-white/[0.06]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
                        agentModeEnabled
                          ? "translate-x-3.5"
                          : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>

              <p
                className={cn(
                  "mt-1.5 text-[10px] leading-relaxed",
                  agentModeEnabled ? "text-emerald-100/70" : "text-white/28",
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
