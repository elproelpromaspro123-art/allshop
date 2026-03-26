/**
 * Logging System - Centralizado para auditoría y debugging.
 * Emite JSON estructurado en producción y salida legible en desarrollo.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  route?: string;
  runtime?: "client" | "server";
}

type EntryOptions = {
  context?: Record<string, unknown>;
  stackTrace?: string;
  error?: Error | unknown;
};

class Logger {
  private isDev = process.env.NODE_ENV === "development";
  private isServer = typeof window === "undefined";

  constructor(private readonly baseContext: Record<string, unknown> = {}) {}

  public child(context: Record<string, unknown>): Logger {
    return new Logger({ ...this.baseContext, ...context });
  }

  private getContextValue(key: string): string | undefined {
    const value = this.baseContext[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private mergeContext(context?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.baseContext,
      ...(context || {}),
    };
  }

  private normalizeContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const entries = Object.entries(context).filter(([, value]) => value !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  private getRuntimeContext(): Pick<
    LogEntry,
    "requestId" | "userAgent" | "url" | "route" | "runtime"
  > {
    const url = this.isServer ? this.getContextValue("url") : window.location.href;
    const route = this.isServer
      ? this.getContextValue("route")
      : window.location.pathname;

    return {
      requestId: this.getContextValue("requestId"),
      userAgent: this.isServer
        ? this.getContextValue("userAgent")
        : navigator.userAgent,
      url,
      route,
      runtime: this.isServer ? "server" : "client",
    };
  }

  private async writeEntry(level: LogLevel, message: string, options: EntryOptions = {}): Promise<void> {
    const context = this.normalizeContext(this.mergeContext(options.context));
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...this.getRuntimeContext(),
      ...(options.stackTrace ? { stackTrace: options.stackTrace } : {}),
    };

    if (this.isDev || level !== "debug") {
      this.logToConsole(entry);
    }

    if (!this.isDev && (level === "error" || level === "critical")) {
      await this.logToDiscord(entry);
    }

    if (!this.isDev && level === "critical") {
      await this.logToSentry(entry, options.error);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const colors = {
      debug: "\x1b[36m",
      info: "\x1b[32m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
      critical: "\x1b[35m",
      reset: "\x1b[0m",
    };

    if (!this.isDev) {
      console.log(
        JSON.stringify({
          ...entry,
          context: entry.context || undefined,
        }),
      );
      return;
    }

    const color = colors[entry.level];
    const timestamp = entry.timestamp.split("T")[1].split(".")[0];

    console.log(
      `${color}[${entry.level.toUpperCase()}] ${timestamp} - ${entry.message}${colors.reset}`,
      entry.context ? entry.context : "",
    );

    if (entry.stackTrace) {
      console.log(`${color}Stack: ${entry.stackTrace}${colors.reset}`);
    }
  }

  private async logToDiscord(entry: LogEntry): Promise<void> {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) return;

      const embed = {
        title: `ALERTA ${entry.level.toUpperCase()}: ${entry.message}`,
        color:
          entry.level === "critical"
            ? 0xff0000
            : entry.level === "error"
              ? 0xff6600
              : 0xffff00,
        fields: [
          {
            name: "Timestamp",
            value: entry.timestamp,
            inline: true,
          },
          ...(entry.requestId
            ? [
                {
                  name: "Request ID",
                  value: entry.requestId,
                  inline: true,
                },
              ]
            : []),
          ...(entry.route
            ? [
                {
                  name: "Route",
                  value: entry.route,
                  inline: true,
                },
              ]
            : []),
          ...(entry.context
            ? [
                {
                  name: "Context",
                  value: JSON.stringify(entry.context, null, 2).slice(0, 1000),
                },
              ]
            : []),
          ...(entry.url
            ? [
                {
                  name: "URL",
                  value: entry.url,
                },
              ]
            : []),
        ],
        footer: {
          text: "Vortixy Error Logger",
        },
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch((err) => {
        void err;
      });
    } catch {
      // Silent failure to prevent infinite loops
    }
  }

  private async logToSentry(entry: LogEntry, error?: Error | unknown): Promise<void> {
    try {
      const sentry = await import("@sentry/nextjs");
      const exception = error instanceof Error ? error : new Error(entry.message);

      sentry.captureException(exception, {
        tags: {
          level: entry.level,
          runtime: entry.runtime || "server",
        },
        extra: {
          context: entry.context || undefined,
          requestId: entry.requestId,
          route: entry.route,
          url: entry.url,
        },
      });
    } catch {
      // Silent failure to prevent infinite loops
    }
  }

  public debug(message: string, context?: Record<string, unknown>): Promise<void> {
    return this.writeEntry("debug", message, { context });
  }

  public info(message: string, context?: Record<string, unknown>): Promise<void> {
    return this.writeEntry("info", message, { context });
  }

  public warn(message: string, context?: Record<string, unknown>): Promise<void> {
    return this.writeEntry("warn", message, { context });
  }

  public error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
  ): Promise<void> {
    let stackTrace: string | undefined;
    let errorContext = { ...(context || {}) };

    if (error instanceof Error) {
      stackTrace = error.stack;
      errorContext = {
        ...errorContext,
        errorName: error.name,
        errorMessage: error.message,
      };
    } else if (typeof error === "string") {
      errorContext = {
        ...errorContext,
        errorString: error,
      };
    }

    return this.writeEntry("error", message, {
      context: errorContext,
      stackTrace,
      error,
    });
  }

  public critical(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
  ): Promise<void> {
    let stackTrace: string | undefined;
    let errorContext = { ...(context || {}) };

    if (error instanceof Error) {
      stackTrace = error.stack;
      errorContext = {
        ...errorContext,
        errorName: error.name,
        errorMessage: error.message,
      };
    }

    return this.writeEntry("critical", message, {
      context: errorContext,
      stackTrace,
      error,
    });
  }

  /**
   * Log de acciones de checkout (auditoría)
   */
  public checkoutEvent(
    action: "start" | "validate" | "process" | "success" | "failed",
    context: Record<string, unknown>,
  ): Promise<void> {
    return this.info(`[CHECKOUT] ${action.toUpperCase()}`, context);
  }

  /**
   * Log de eventos de seguridad
   */
  public securityEvent(
    eventType:
      | "rate_limit"
      | "csrf_fail"
      | "ip_block"
      | "vpn_detect"
      | "suspicious_activity",
    context: Record<string, unknown>,
  ): Promise<void> {
    return this.warn(`[SECURITY] ${eventType.toUpperCase()}`, context);
  }

  /**
   * Log de performance
   */
  public performanceMetric(
    metric: string,
    duration: number,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.info(`[PERF] ${metric}: ${duration}ms`, {
      ...context,
      duration,
    });
  }
}

export const logger = new Logger();
