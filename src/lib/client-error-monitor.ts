export const HYDRATION_ERROR_PATTERNS = [
  "Minified React error #418",
  "Hydration failed",
  "while hydrating",
  "server-rendered HTML",
  "Text content does not match server-rendered HTML",
  "didn't match",
  "did not match",
] as const;

export type ClientErrorSource = "window_error" | "unhandled_rejection";

export interface ClientErrorTelemetryPayload {
  source: ClientErrorSource;
  message: string;
  stack?: string | null;
  pathname?: string | null;
  href?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  fbclid?: string | null;
  filename?: string | null;
  line?: number | null;
  column?: number | null;
}

export function isHydrationErrorCandidate(
  message: string,
  stack?: string | null,
): boolean {
  const combined = `${message || ""}\n${stack || ""}`.toLowerCase();
  return HYDRATION_ERROR_PATTERNS.some((pattern) =>
    combined.includes(pattern.toLowerCase()),
  );
}

export function normalizeClientRuntimeError(value: unknown): {
  message: string;
  stack: string | null;
} {
  if (value instanceof Error) {
    return {
      message: String(value.message || value.name || "Unknown runtime error"),
      stack: value.stack || null,
    };
  }

  if (typeof value === "string") {
    return { message: value, stack: null };
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      message?: unknown;
      stack?: unknown;
      reason?: unknown;
    };

    if (candidate.reason !== undefined) {
      return normalizeClientRuntimeError(candidate.reason);
    }

    return {
      message: String(candidate.message || "Unknown runtime error"),
      stack:
        typeof candidate.stack === "string" && candidate.stack.trim()
          ? candidate.stack
          : null,
    };
  }

  return {
    message: "Unknown runtime error",
    stack: null,
  };
}

export function extractFbclid(value: string | null | undefined): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw, "https://vortixy.net");
    const fbclid = url.searchParams.get("fbclid");
    if (!fbclid) return null;
    return fbclid.trim().slice(0, 240) || null;
  } catch {
    return null;
  }
}

export function buildClientErrorFingerprint(
  payload: ClientErrorTelemetryPayload,
): string {
  return [
    payload.source,
    payload.pathname || "",
    payload.message || "",
    payload.filename || "",
    String(payload.line ?? ""),
    payload.fbclid || "",
  ]
    .join("|")
    .toLowerCase();
}
