import type { ChatSource } from "@/lib/chatbot-types";

interface SearchResult {
  title?: string;
  url?: string;
  content?: string;
}

interface BrowserResult {
  title?: string;
  url?: string;
  content?: string;
  live_view_url?: string;
}

export interface ExecutedTool {
  type?: string;
  search_results?: {
    results?: SearchResult[];
  } | null;
  browser_results?: BrowserResult[];
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

function truncateSnippet(value: string | undefined, maxLength = 180): string | undefined {
  const snippet = cleanString(value, maxLength);
  return snippet || undefined;
}

function normalizeHostname(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeExecutedToolType(type: string | undefined): string {
  const normalized = cleanString(type, 80).toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "search":
    case "web_search":
      return "web_search";
    case "visit":
    case "visit_website":
      return "visit_website";
    case "python":
    case "code_interpreter":
      return "code_interpreter";
    case "browser":
    case "browser_automation":
      return "browser_automation";
    default:
      return normalized;
  }
}

export function uniqueToolTypes(executedTools: ExecutedTool[] | undefined): string[] {
  if (!executedTools?.length) {
    return [];
  }

  return Array.from(
    new Set(
      executedTools
        .map((tool) => normalizeExecutedToolType(tool.type))
        .filter(Boolean)
    )
  );
}

export function isOfficialStoreUrl(url: string, baseUrl: string): boolean {
  const sourceHost = normalizeHostname(url);
  const baseHost = normalizeHostname(baseUrl);

  if (!sourceHost || !baseHost) {
    return false;
  }

  return sourceHost === baseHost;
}

export function collectChatSources(
  executedTools: ExecutedTool[] | undefined,
  options: { baseUrl: string; officialOnly?: boolean }
): ChatSource[] {
  if (!executedTools?.length) {
    return [];
  }

  const sources = new Map<string, ChatSource>();
  const officialOnly = options.officialOnly === true;

  for (const tool of executedTools) {
    for (const result of tool.search_results?.results || []) {
      const url = cleanString(result.url, 320);

      if (!url || sources.has(url) || (officialOnly && !isOfficialStoreUrl(url, options.baseUrl))) {
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

      if (!url || sources.has(url) || (officialOnly && !isOfficialStoreUrl(url, options.baseUrl))) {
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
