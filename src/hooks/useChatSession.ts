"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  createChatSession,
  createChatSessionStore,
  getChatSessionById,
  sanitizeStoredChatSessionStore,
  upsertChatSessionStore,
  type ChatSessionMessage,
  type ChatSessionState,
  type ChatSessionStore,
} from "@/lib/chatbot-session";

const LEGACY_MESSAGES_STORAGE_KEY = "vortixy_support_assistant_messages";
const SESSION_STORAGE_KEY = "vortixy_support_assistant_session_v2";
const USER_MESSAGE_MAX_CHARS = 3000;

type ChatMessage = ChatSessionMessage;

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
        if (!role || !content) return null;
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

export function useChatSession() {
  const [sessionStore, setSessionStore] = useState<ChatSessionStore>(() =>
    createChatSessionStore(),
  );
  const [sessionHydrated, setSessionHydrated] = useState(false);

  const session = (getChatSessionById(
    sessionStore,
    sessionStore.activeSessionId,
  ) || sessionStore.sessions[0]) as ChatSessionState;

  const messages = session.messages;

  // Hydrate from localStorage on mount
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
    } catch {
      setSessionStore(createChatSessionStore());
    } finally {
      setSessionHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever store changes
  useEffect(() => {
    if (!sessionHydrated) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionStore));
      localStorage.removeItem(LEGACY_MESSAGES_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }, [sessionHydrated, sessionStore]);

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

  const openConversation = useCallback((sessionId: string) => {
    setSessionStore((prev) =>
      createChatSessionStore({
        activeSessionId: sessionId,
        sessions: prev.sessions,
      }),
    );
  }, []);

  const deleteConversation = useCallback(
    (sessionId: string) => {
      setSessionStore((prev) => {
        const nextSessions = prev.sessions.filter((s) => s.id !== sessionId);
        const nextActiveId =
          prev.activeSessionId === sessionId
            ? nextSessions[0]?.id || ""
            : prev.activeSessionId;
        return {
          ...prev,
          activeSessionId: nextActiveId,
          sessions: nextSessions.length ? nextSessions : [createChatSession()],
        };
      });
    },
    [],
  );

  return {
    sessionStore,
    setSessionStore,
    session,
    messages,
    sessionHydrated,
    updateSessionById,
    updateActiveSession,
    openConversation,
    deleteConversation,
  };
}
