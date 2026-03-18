import type { AssistantAction, ChatSource } from "@/lib/chatbot-types";

export const MAX_CHAT_CONTEXT_CHARS = 12_000;
export const MAX_CHAT_SUMMARY_CHARS = 1_200;

export interface ChatSessionMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  action?: AssistantAction | null;
  actionExecuted?: boolean;
  tools?: string[];
  sources?: ChatSource[];
}

export interface ChatSessionState {
  id: string;
  createdAt: string;
  updatedAt: string;
  carryoverSummary?: string | null;
  messages: ChatSessionMessage[];
}

export interface ChatContextUsage {
  isLimitReached: boolean;
  max: number;
  percentRemaining: number;
  percentUsed: number;
  remaining: number;
  used: number;
}

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

function sanitizeMessages(rawMessages: unknown): ChatSessionMessage[] {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .map((entry): ChatSessionMessage | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const message = entry as Partial<ChatSessionMessage>;
      const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
      const content = cleanString(message.content, 3_000);

      if (!role || !content) {
        return null;
      }

      return {
        id: cleanString(message.id, 120) || crypto.randomUUID(),
        role,
        content,
        action: message.action || null,
        actionExecuted: Boolean(message.actionExecuted),
        tools: Array.isArray(message.tools) ? message.tools.filter((item) => typeof item === "string") : [],
        sources: Array.isArray(message.sources) ? message.sources.filter(Boolean) as ChatSource[] : [],
      };
    })
    .filter((message): message is ChatSessionMessage => Boolean(message));
}

export function createChatSession(input?: {
  carryoverSummary?: string | null;
  messages?: ChatSessionMessage[];
}): ChatSessionState {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    carryoverSummary: cleanString(input?.carryoverSummary, MAX_CHAT_SUMMARY_CHARS) || null,
    messages: sanitizeMessages(input?.messages || []),
  };
}

export function sanitizeStoredChatSession(value: string | null): ChatSessionState | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ChatSessionState>;
    const messages = sanitizeMessages(parsed.messages);

    return {
      id: cleanString(parsed.id, 120) || crypto.randomUUID(),
      createdAt: cleanString(parsed.createdAt, 40) || new Date().toISOString(),
      updatedAt: cleanString(parsed.updatedAt, 40) || new Date().toISOString(),
      carryoverSummary: cleanString(parsed.carryoverSummary, MAX_CHAT_SUMMARY_CHARS) || null,
      messages,
    };
  } catch {
    return null;
  }
}

export function calculateChatContextUsage(input: {
  carryoverSummary?: string | null;
  max?: number;
  messages: Array<Pick<ChatSessionMessage, "content" | "role">>;
}): ChatContextUsage {
  const max = Math.max(1, Number(input.max) || MAX_CHAT_CONTEXT_CHARS);
  const summaryLength = cleanString(input.carryoverSummary, MAX_CHAT_SUMMARY_CHARS).length;
  const messagesLength = input.messages.reduce((total, message) => {
    return total + cleanString(message.content, 3_000).length + message.role.length + 8;
  }, 0);
  const used = summaryLength + messagesLength;
  const remaining = Math.max(0, max - used);
  const percentUsed = Math.min(100, Math.round((used / max) * 100));
  const percentRemaining = Math.max(0, 100 - percentUsed);

  return {
    used,
    max,
    remaining,
    percentUsed,
    percentRemaining,
    isLimitReached: used >= max,
  };
}

function truncateForSummary(value: string, maxLength: number): string {
  const cleanValue = cleanString(value, maxLength);

  if (cleanValue.length <= maxLength - 3) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function buildChatCarryoverSummary(
  messages: Array<Pick<ChatSessionMessage, "content" | "role">>,
  maxLength = MAX_CHAT_SUMMARY_CHARS
): string | null {
  const recentMessages = messages
    .filter((message) => cleanString(message.content, 3_000).length > 0)
    .slice(-12);

  if (!recentMessages.length) {
    return null;
  }

  const lines = recentMessages.map((message) => {
    const prefix = message.role === "user" ? "Usuario" : "Asistente";
    return `- ${prefix}: ${truncateForSummary(message.content, 180)}`;
  });

  const summary = [
    "Resumen breve de la conversacion anterior para continuar este chat sin perder contexto:",
    ...lines,
  ].join("\n");

  return truncateForSummary(summary, maxLength);
}
