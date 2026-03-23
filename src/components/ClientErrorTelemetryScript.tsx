import {
  HYDRATION_ERROR_PATTERNS,
} from "@/lib/client-error-monitor";

const TELEMETRY_EXCLUDED_PREFIXES = ["/panel-privado", "/bloqueado"];
const CLIENT_ERROR_ENDPOINT = "/api/internal/client-errors";

function getClientErrorTelemetryScript(): string {
  return `
    (() => {
      if (typeof window === "undefined") return;
      if (!${JSON.stringify(process.env.NODE_ENV === "production")}) return;
      if (window.__vortixyClientErrorTelemetryInstalled) return;

      window.__vortixyClientErrorTelemetryInstalled = true;

      const endpoint = ${JSON.stringify(CLIENT_ERROR_ENDPOINT)};
      const excludedPrefixes = ${JSON.stringify(TELEMETRY_EXCLUDED_PREFIXES)};
      const hydrationPatterns = ${JSON.stringify(HYDRATION_ERROR_PATTERNS)};
      const reportedFingerprints = Object.create(null);

      const shouldSkip = () => {
        const pathname = window.location.pathname || "/";
        const hostname = window.location.hostname || "";
        return excludedPrefixes.some((prefix) => pathname.startsWith(prefix))
          || hostname === "localhost"
          || hostname === "127.0.0.1";
      };

      const normalizeError = (value) => {
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
          if (value.reason !== undefined) {
            return normalizeError(value.reason);
          }

          return {
            message: String(value.message || "Unknown runtime error"),
            stack: typeof value.stack === "string" ? value.stack : null,
          };
        }

        return {
          message: "Unknown runtime error",
          stack: null,
        };
      };

      const isHydrationCandidate = (message, stack) => {
        const combined = String((message || "") + "\\n" + (stack || "")).toLowerCase();
        return hydrationPatterns.some((pattern) =>
          combined.includes(String(pattern).toLowerCase()),
        );
      };

      const extractFbclid = (href) => {
        try {
          return new URL(href, window.location.origin).searchParams.get("fbclid");
        } catch {
          return null;
        }
      };

      const buildFingerprint = (payload) =>
        [
          payload.source,
          payload.pathname || "",
          payload.message || "",
          payload.filename || "",
          String(payload.line ?? ""),
          payload.fbclid || "",
        ]
          .join("|")
          .toLowerCase();

      const sendPayload = (payload) => {
        const fingerprint = buildFingerprint(payload);
        if (reportedFingerprints[fingerprint]) return;
        reportedFingerprints[fingerprint] = true;

        const body = JSON.stringify(payload);

        try {
          if (navigator.sendBeacon && typeof Blob !== "undefined") {
            const blob = new Blob([body], { type: "application/json" });
            navigator.sendBeacon(endpoint, blob);
            return;
          }
        } catch {
          // noop
        }

        try {
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
            credentials: "same-origin",
          }).catch(() => {});
        } catch {
          // noop
        }
      };

      const report = (source, rawError, extra) => {
        if (shouldSkip()) return;

        const normalized = normalizeError(rawError);
        if (!normalized.message || !isHydrationCandidate(normalized.message, normalized.stack)) {
          return;
        }

        const href = window.location.href;

        sendPayload({
          source,
          message: normalized.message,
          stack: normalized.stack,
          pathname: window.location.pathname || "/",
          href,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent || null,
          fbclid: extractFbclid(href),
          filename: extra && extra.filename ? extra.filename : null,
          line: extra && Number.isFinite(extra.line) ? extra.line : null,
          column: extra && Number.isFinite(extra.column) ? extra.column : null,
        });
      };

      window.addEventListener("error", (event) => {
        report("window_error", event.error || event.message, {
          filename: event.filename || null,
          line: event.lineno,
          column: event.colno,
        });
      }, true);

      window.addEventListener("unhandledrejection", (event) => {
        report("unhandled_rejection", event.reason, null);
      });
    })();
  `;
}

export function ClientErrorTelemetryScript() {
  return (
    <script
      id="client-error-telemetry"
      dangerouslySetInnerHTML={{
        __html: getClientErrorTelemetryScript(),
      }}
    />
  );
}
