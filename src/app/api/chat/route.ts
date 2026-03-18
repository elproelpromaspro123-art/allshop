import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildChatbotSystemPrompt } from "@/lib/chatbot-prompt";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/site";
import { getClientIp } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIMARY_MODEL = "groq/compound";
const FALLBACK_MODEL = "groq/compound-mini";
const LATEST_COMPOUND_VERSION = "latest";
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 3000;

type ChatRole = "user" | "assistant";

interface ChatRequestMessage {
  role?: string;
  content?: string;
}

interface ChatRequestBody {
  messages?: ChatRequestMessage[];
  browserAutomationAllowed?: boolean;
  pageTitle?: string;
  pageUrl?: string;
}

interface SanitizedMessage {
  role: ChatRole;
  content: string;
}

interface ChatSource {
  title: string;
  url: string;
  snippet?: string;
  liveViewUrl?: string;
  type: "browser" | "search";
}

interface CompoundRequestConfig {
  enabledTools: string[];
  maxToolCalls: number;
  modelVersion: string;
}

function cleanString(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

function getSourceTitle(title: string | undefined, url: string): string {
  const cleanTitle = cleanString(title, 160);

  if (cleanTitle) {
    return cleanTitle;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function createGroqClient(modelVersion?: string) {
  const apiKey = process.env.GROQ_API || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Groq({
    apiKey,
    maxRetries: 1,
    timeout: 45_000,
    ...(modelVersion
      ? {
          defaultHeaders: {
            "Groq-Model-Version": modelVersion,
          },
        }
      : {}),
  });
}

function getCompoundRequestConfig(
  model: string,
  browserAutomationAllowed: boolean
): CompoundRequestConfig {
  if (browserAutomationAllowed) {
    return {
      enabledTools: ["browser_automation", "web_search"],
      maxToolCalls: model === FALLBACK_MODEL ? 1 : 10,
      modelVersion: LATEST_COMPOUND_VERSION,
    };
  }

  if (model === FALLBACK_MODEL) {
    return {
      enabledTools: ["web_search"],
      maxToolCalls: 1,
      modelVersion: LATEST_COMPOUND_VERSION,
    };
  }

  return {
    enabledTools: ["web_search", "visit_website", "code_interpreter"],
    maxToolCalls: 10,
    modelVersion: LATEST_COMPOUND_VERSION,
  };
}

function sanitizePageUrl(value: unknown): string {
  const pageUrl = cleanString(value, 320);

  if (!pageUrl) {
    return "";
  }

  try {
    const url = new URL(pageUrl);
    const baseUrl = new URL(getBaseUrl());

    if (url.origin !== baseUrl.origin) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function sanitizeMessages(rawMessages: ChatRequestMessage[]): SanitizedMessage[] {
  return rawMessages
    .slice(-MAX_MESSAGES)
    .map((message): SanitizedMessage => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: cleanString(message.content, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0);
}

function uniqueToolTypes(executedTools: Array<{ type?: string }> | undefined): string[] {
  if (!executedTools?.length) {
    return [];
  }

  return Array.from(
    new Set(
      executedTools
        .map((tool) => cleanString(tool.type, 80))
        .filter(Boolean)
    )
  );
}

function truncateSnippet(value: string | undefined, maxLength = 180): string | undefined {
  const snippet = cleanString(value, maxLength);
  return snippet || undefined;
}

function collectSources(
  executedTools: Array<{
    search_results?: {
      results?: Array<{ title?: string; url?: string; content?: string }>;
    } | null;
    browser_results?: Array<{
      title: string;
      url: string;
      content?: string;
      live_view_url?: string;
    }>;
  }> | undefined
): ChatSource[] {
  if (!executedTools?.length) {
    return [];
  }

  const sources = new Map<string, ChatSource>();

  for (const tool of executedTools) {
    for (const result of tool.search_results?.results || []) {
      const url = cleanString(result.url, 320);

      if (!url || sources.has(url)) {
        continue;
      }

      sources.set(url, {
        type: "search",
        title: getSourceTitle(result.title, url),
        url,
        snippet: truncateSnippet(result.content),
      });
    }

    for (const result of tool.browser_results || []) {
      const url = cleanString(result.url, 320);

      if (!url || sources.has(url)) {
        continue;
      }

      sources.set(url, {
        type: "browser",
        title: getSourceTitle(result.title, url),
        url,
        snippet: truncateSnippet(result.content),
        liveViewUrl: cleanString(result.live_view_url, 320) || undefined,
      });
    }
  }

  return Array.from(sources.values()).slice(0, 6);
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

async function runCompoundRequest({
  model,
  messages,
  browserAutomationAllowed,
  pageTitle,
  pageUrl,
  userId,
}: {
  model: string;
  messages: SanitizedMessage[];
  browserAutomationAllowed: boolean;
  pageTitle: string;
  pageUrl: string;
  userId: string;
}) {
  const config = getCompoundRequestConfig(model, browserAutomationAllowed);
  const client = createGroqClient(config.modelVersion);

  if (!client) {
    throw new Error("missing_groq_api_key");
  }

  const response = await client.chat.completions.create({
    model,
    temperature: 0.6,
    top_p: 1,
    max_completion_tokens: 1024,
    user: userId,
    messages: [
      {
        role: "system",
        content: buildChatbotSystemPrompt({
          browserAutomationAllowed,
          enabledTools: config.enabledTools,
          maxToolCalls: config.maxToolCalls,
          pageTitle,
          pageUrl,
        }),
      },
      ...messages,
    ],
    compound_custom: {
      tools: {
        enabled_tools: config.enabledTools,
      },
    },
  });

  const message = response.choices[0]?.message;
  const answer = cleanString(message?.content, 10_000);

  if (!answer) {
    throw new Error("empty_chat_response");
  }

  return {
    answer,
    tools: uniqueToolTypes(message?.executed_tools),
    sources: collectSources(message?.executed_tools),
  };
}

function shouldFallback(error: unknown): boolean {
  if (!(error instanceof Groq.APIError)) {
    return true;
  }

  return error.status !== 401 && error.status !== 403;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `chat:${clientIp}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera un momento e intenta nuevamente." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  const messages = sanitizeMessages(Array.isArray(body.messages) ? body.messages : []);
  const browserAutomationAllowed = Boolean(body.browserAutomationAllowed);
  const pageTitle = cleanString(body.pageTitle, 140);
  const pageUrl = sanitizePageUrl(body.pageUrl);

  if (!messages.length) {
    return NextResponse.json({ error: "Envia al menos un mensaje." }, { status: 400 });
  }

  const userId = `visitor:${cleanString(clientIp, 64) || "unknown"}`;

  try {
    const result = await runCompoundRequest({
      model: PRIMARY_MODEL,
      messages,
      browserAutomationAllowed,
      pageTitle,
      pageUrl,
      userId,
    });

    return NextResponse.json(result);
  } catch (primaryError) {
    if (!shouldFallback(primaryError)) {
      if (primaryError instanceof Groq.APIError) {
        logGroqError("Compound", primaryError);

        return NextResponse.json(
          { error: "No fue posible autenticar el asistente en este momento." },
          { status: primaryError.status || 500 }
        );
      }

      if (primaryError instanceof Error && primaryError.message === "missing_groq_api_key") {
        return NextResponse.json(
          { error: "El asistente aun no esta configurado. Agrega GROQ_API en el entorno del servidor." },
          { status: 503 }
        );
      }

      logGroqError("Compound", primaryError);

      return NextResponse.json(
        { error: "No fue posible procesar la consulta ahora." },
        { status: 500 }
      );
    }

    try {
      const fallback = await runCompoundRequest({
        model: FALLBACK_MODEL,
        messages,
        browserAutomationAllowed,
        pageTitle,
        pageUrl,
        userId,
      });

      return NextResponse.json(fallback);
    } catch (fallbackError) {
      logGroqError("Compound", primaryError);
      logGroqError("Compound Mini", fallbackError);

      if (fallbackError instanceof Error && fallbackError.message === "missing_groq_api_key") {
        return NextResponse.json(
          { error: "El asistente aun no esta configurado. Agrega GROQ_API en el entorno del servidor." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "El asistente no pudo responder ahora. Puedes intentar de nuevo o escalar a WhatsApp." },
        { status: 502 }
      );
    }
  }
}
