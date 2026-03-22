import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { apiError, apiOkFields } from "@/lib/api-response";
import { buildChatbotSystemPrompt, isUserMessageSafe } from "@/lib/chatbot-prompt";
import { collectChatSources, uniqueToolTypes } from "@/lib/chatbot-runtime";
import {
  getChatbotStorefrontContext,
  type ChatbotStorefrontContext,
} from "@/lib/chatbot-storefront";
import type { ChatResponse } from "@/lib/chatbot-types";
import { getGroqApiKey } from "@/lib/env";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/site";
import { getClientIp } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 10 * 1024;

const PRIMARY_MODEL = "groq/compound";
const FALLBACK_MODEL = "groq/compound-mini";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 3000;

type ChatRole = "user" | "assistant";

interface ChatRequestMessage {
  role?: string;
  content?: string;
}

interface ChatRequestBody {
  messages?: ChatRequestMessage[];
  agentModeEnabled?: boolean;
  browserAutomationAllowed?: boolean;
  conversationSummary?: string;
  pageTitle?: string;
  pageUrl?: string;
}

interface SanitizedMessage {
  role: ChatRole;
  content: string;
}

interface CompoundRequestConfig {
  enabledTools: string[];
  maxToolCalls: number;
  requestTools?: string[];
}

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function createGroqClient() {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    return null;
  }

  return new Groq({
    apiKey,
    maxRetries: 1,
    timeout: 45_000,
  });
}

function getCompoundRequestConfig(
  model: string,
  agentModeEnabled: boolean,
): CompoundRequestConfig {
  if (agentModeEnabled) {
    return {
      enabledTools: ["browser_automation", "web_search"],
      maxToolCalls: model === FALLBACK_MODEL ? 1 : 10,
      requestTools: ["browser_automation", "web_search"],
    };
  }

  if (model === FALLBACK_MODEL) {
    return {
      enabledTools: ["web_search"],
      maxToolCalls: 1,
      requestTools: ["web_search"],
    };
  }

  return {
    enabledTools: ["web_search", "visit_website", "code_interpreter"],
    maxToolCalls: 10,
    requestTools: ["web_search", "visit_website", "code_interpreter"],
  };
}

function sanitizePageUrl(value: unknown): string {
  const pageUrl = cleanString(value, 320);

  if (!pageUrl) {
    return "";
  }

  try {
    const baseUrl = new URL(getBaseUrl());
    const url = new URL(pageUrl, baseUrl);
    return new URL(
      `${url.pathname}${url.search}${url.hash}`,
      baseUrl,
    ).toString();
  } catch {
    return "";
  }
}

function sanitizeMessages(
  rawMessages: ChatRequestMessage[],
): SanitizedMessage[] {
  return rawMessages
    .slice(-MAX_MESSAGES)
    .map(
      (message): SanitizedMessage => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: cleanString(message.content, MAX_MESSAGE_LENGTH),
      }),
    )
    .filter((message) => message.content.length > 0);
}

function logGroqError(label: string, error: unknown) {
  if (error instanceof Groq.APIError) {
    const details = (error.error || {}) as {
      code?: string;
      message?: string;
      type?: string;
    };

    console.error(`[Chatbot] ${label} API error`, {
      status: error.status,
      type: details.type || null,
      code: details.code || null,
      message: details.message || error.message,
      requestId:
        error.headers?.get("x-request-id") ||
        error.headers?.get("request-id") ||
        null,
    });
    return;
  }

  console.error(`[Chatbot] ${label} error:`, error);
}

async function runCompoundRequest(input: {
  model: string;
  messages: SanitizedMessage[];
  agentModeEnabled: boolean;
  conversationSummary: string;
  pageTitle: string;
  pageUrl: string;
  latestUserMessage: string;
  storefrontContext: ChatbotStorefrontContext;
}) {
  const config = getCompoundRequestConfig(input.model, input.agentModeEnabled);
  const client = createGroqClient();

  if (!client) {
    throw new Error("missing_groq_api_key");
  }

  const response = await client.chat.completions.create({
    model: input.model,
    messages: [
      {
        role: "system",
        content: buildChatbotSystemPrompt({
          agentModeEnabled: input.agentModeEnabled,
          catalogSummary: input.storefrontContext.catalogSummary,
          conversationSummary: input.conversationSummary,
          currentPageSummary: input.storefrontContext.currentPageSummary,
          enabledTools: config.enabledTools,
          maxToolCalls: config.maxToolCalls,
          navigationSummary: input.storefrontContext.navigationSummary,
          pageTitle: input.pageTitle,
          pageUrl: input.pageUrl,
          suggestedAction: input.storefrontContext.action,
        }),
      },
      ...input.messages,
    ],
    ...(config.requestTools
      ? {
          compound_custom: {
            tools: {
              enabled_tools: config.requestTools,
            },
          },
        }
      : {}),
  });

  const message = response.choices[0]?.message;
  const answer = cleanString(message?.content, 10_000);

  if (!answer) {
    throw new Error("empty_chat_response");
  }

  return {
    answer,
    tools: uniqueToolTypes(message?.executed_tools),
    sources: collectChatSources(message?.executed_tools, {
      baseUrl: getBaseUrl(),
      officialOnly: input.storefrontContext.preferLocalResponse,
    }),
    action: input.storefrontContext.action,
  } satisfies ChatResponse;
}

function buildLocalFallbackResponse(
  storefrontContext: ChatbotStorefrontContext,
  note?: string,
): ChatResponse {
  const answer = note
    ? `${storefrontContext.fallbackAnswer}\n\n${note}`
    : storefrontContext.fallbackAnswer;

  return {
    answer,
    action: storefrontContext.action,
    tools: [],
    sources: [],
  };
}

function buildResearchUnavailableResponse(note?: string): ChatResponse {
  const answer = [
    "Ahora mismo no pude completar la verificacion web en vivo.",
    "Si quieres, intenta de nuevo en unos segundos o preguntame por productos, categorias, pagos, envios, seguimiento o soporte dentro de Vortixy.",
    note || null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    answer,
    action: null,
    tools: [],
    sources: [],
  };
}

function buildSafeFallbackResponse(
  storefrontContext: ChatbotStorefrontContext,
  note?: string,
): ChatResponse {
  if (storefrontContext.preferLocalResponse) {
    return buildLocalFallbackResponse(storefrontContext, note);
  }

  return buildResearchUnavailableResponse(note);
}

function shouldFallback(error: unknown): boolean {
  if (!(error instanceof Groq.APIError)) {
    return true;
  }

  return error.status !== 401 && error.status !== 403;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    console.warn(`[Chat] Large body rejected for IP: ${clientIp}`);
    return apiError("Solicitud demasiado grande.", {
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `chat:${clientIp}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[Chat] Rate limit hit for IP: ${clientIp}`);
    return apiError(
      "Demasiadas consultas. Espera un momento e intenta nuevamente.",
      {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return apiError("Solicitud invalida.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const messages = sanitizeMessages(
    Array.isArray(body.messages) ? body.messages : [],
  );

  const lastUserMsg = sanitizeText(
    [...messages].reverse().find((m) => m.role === "user")?.content || "",
    2000,
  );
  if (!lastUserMsg || lastUserMsg.length < 1) {
    return apiError("Mensaje inválido o demasiado largo.", {
      status: 400,
      code: "INVALID_MESSAGE",
    });
  }

  if (!isUserMessageSafe(lastUserMsg)) {
    return apiOkFields({
      answer: "No puedo procesar ese tipo de solicitud. ¿Puedo ayudarte con productos, envíos, seguimiento o soporte?",
      action: null,
      tools: [],
      sources: [],
    } satisfies ChatResponse);
  }

  const agentModeEnabled = Boolean(
    body.agentModeEnabled ?? body.browserAutomationAllowed,
  );
  const conversationSummary = cleanString(body.conversationSummary, 1_500);
  const pageTitle = cleanString(body.pageTitle, 140);
  const pageUrl = sanitizePageUrl(body.pageUrl);
  const latestUserMessage = lastUserMsg;
  const storefrontContext = await getChatbotStorefrontContext({
    agentModeEnabled,
    conversationMessages: messages,
    latestUserMessage,
    pageUrl,
  });

  if (!messages.length) {
    return apiError("Envia al menos un mensaje.", {
      status: 400,
      code: "MISSING_MESSAGES",
    });
  }

  if (storefrontContext.preferLocalResponse) {
    return apiOkFields(buildLocalFallbackResponse(storefrontContext));
  }

  try {
    const result = await runCompoundRequest({
      model: PRIMARY_MODEL,
      messages,
      agentModeEnabled,
      conversationSummary,
      pageTitle,
      pageUrl,
      latestUserMessage,
      storefrontContext,
    });

    return apiOkFields(result);
  } catch (primaryError) {
    if (!shouldFallback(primaryError)) {
      if (primaryError instanceof Groq.APIError) {
        logGroqError("Compound", primaryError);

        return apiError(
          "No fue posible autenticar el asistente en este momento.",
          {
            status: primaryError.status || 500,
            code: "CHAT_AUTH_FAILED",
          },
        );
      }

      if (
        primaryError instanceof Error &&
        primaryError.message === "missing_groq_api_key"
      ) {
        return apiOkFields(buildSafeFallbackResponse(storefrontContext));
      }

      logGroqError("Compound", primaryError);

      return apiError("No fue posible procesar la consulta ahora.", {
        status: 500,
        code: "CHAT_PROCESSING_FAILED",
      });
    }

    try {
      const fallback = await runCompoundRequest({
        model: FALLBACK_MODEL,
        messages,
        agentModeEnabled,
        conversationSummary,
        pageTitle,
        pageUrl,
        latestUserMessage,
        storefrontContext,
      });

      return apiOkFields(fallback);
    } catch (fallbackError) {
      logGroqError("Compound", primaryError);
      logGroqError("Compound Mini", fallbackError);

      if (
        fallbackError instanceof Error &&
        fallbackError.message === "missing_groq_api_key"
      ) {
        return apiOkFields(buildSafeFallbackResponse(storefrontContext));
      }

      return apiOkFields(
        buildSafeFallbackResponse(
          storefrontContext,
          "Estoy respondiendo con el contexto vivo del sitio mientras la verificacion avanzada vuelve a estar disponible.",
        ),
      );
    }
  }
}
