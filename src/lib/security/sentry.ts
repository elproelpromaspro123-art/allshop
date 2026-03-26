import { getBaseUrl } from "@/lib/site";

export interface MinimalSentryEvent {
  message?: string;
  transaction?: string;
  exception?: {
    values?: Array<{
      type?: string | null;
      value?: string | null;
    }>;
  };
}

const CLIENT_NOISE_PATTERNS = [
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /safari-extension:\/\//i,
  /ResizeObserver loop limit exceeded/i,
  /NetworkError when attempting to fetch resource/i,
  /Failed to fetch/i,
  /The operation was aborted/i,
  /AbortError/i,
] as const;

export function shouldDropSentryEvent(event: MinimalSentryEvent): boolean {
  const haystack = [
    event.message,
    event.transaction,
    ...(event.exception?.values || []).flatMap((entry) => [
      entry.type || "",
      entry.value || "",
    ]),
  ]
    .filter(Boolean)
    .join("\n");

  return CLIENT_NOISE_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function createSentryBeforeSend() {
  return (event: MinimalSentryEvent) => {
    if (shouldDropSentryEvent(event)) {
      return null;
    }

    return event;
  };
}

export function getRouteSamplingRate(transactionName?: string | null): number {
  const name = String(transactionName || "").toLowerCase();

  if (!name) return 0.15;
  if (name.includes("/checkout") || name.includes("/orden/")) return 1;
  if (name.includes("/panel-privado")) return 0.75;
  if (name.includes("/producto/")) return 0.4;
  if (name.includes("/categoria/")) return 0.25;
  if (name.startsWith("/api/")) return 0.12;
  return 0.18;
}

export function getTracePropagationTargets(): Array<string | RegExp> {
  const targets: Array<string | RegExp> = [
    "localhost",
    /^https?:\/\/localhost:\d+/,
  ];

  try {
    const baseUrl = new URL(getBaseUrl());
    targets.push(baseUrl.origin);
    targets.push(baseUrl.hostname);
  } catch {
    // Fall back to localhost-only propagation.
  }

  return targets;
}
