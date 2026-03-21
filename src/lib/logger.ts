/**
 * Logging System - Centralizado para auditoría y debugging
 * Captura eventos y errores en dev y producción
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

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
}

interface LogDestination {
  console: boolean;
  discord: boolean;
  sentry: boolean;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private isServer = typeof window === 'undefined';

  /**
   * Log genérico con nivel
   */
  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    destinations?: LogDestination
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...(this.isServer && {
        userAgent: process.env.USER_AGENT,
      }),
    };

    // Console output (siempre en dev, en prod solo errores)
    if (!this.isDev && level !== 'debug' && level !== 'info') {
      this.logToConsole(entry);
    } else if (this.isDev) {
      this.logToConsole(entry);
    }

    // Discord webhook para errores críticos en producción
    if (!this.isDev && (level === 'error' || level === 'critical')) {
      await this.logToDiscord(entry);
    }

    // En producción, errores críticos van a Sentry
    if (!this.isDev && level === 'critical') {
      await this.logToSentry(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m',    // cyan
      info: '\x1b[32m',     // green
      warn: '\x1b[33m',     // yellow
      error: '\x1b[31m',    // red
      critical: '\x1b[35m', // magenta
      reset: '\x1b[0m',
    };

    const color = colors[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS

    console.log(
      `${color}[${entry.level.toUpperCase()}] ${timestamp} - ${entry.message}${colors.reset}`,
      entry.context ? entry.context : ''
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
        title: `🚨 ${entry.level.toUpperCase()}: ${entry.message}`,
        color:
          entry.level === 'critical'
            ? 0xff0000 // red
            : entry.level === 'error'
              ? 0xff6600 // orange
              : 0xffff00, // yellow
        fields: [
          {
            name: 'Timestamp',
            value: entry.timestamp,
            inline: true,
          },
          ...(entry.context
            ? [
                {
                  name: 'Context',
                  value: JSON.stringify(entry.context, null, 2).slice(0, 1000),
                },
              ]
            : []),
          ...(entry.url
            ? [
                {
                  name: 'URL',
                  value: entry.url,
                },
              ]
            : []),
        ],
        footer: {
          text: 'Vortixy Error Logger',
        },
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch((err) => {
        console.error('[Logger] Discord webhook failed:', err);
      });
    } catch (error) {
      // Silencio para evitar loops infinitos
    }
  }

  private async logToSentry(entry: LogEntry): Promise<void> {
    try {
      // Si Sentry está configurado en el futuro
      // Sentry.captureException(entry);
    } catch (error) {
      // Silencio
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    let stackTrace: string | undefined;
    let errorContext = context || {};

    if (error instanceof Error) {
      stackTrace = error.stack;
      errorContext = {
        ...errorContext,
        errorName: error.name,
        errorMessage: error.message,
      };
    } else if (typeof error === 'string') {
      errorContext = {
        ...errorContext,
        errorString: error,
      };
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: errorContext,
      stackTrace,
    };

    this.logToConsole(entry);
    this.logToDiscord(entry);
  }

  public critical(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    let stackTrace: string | undefined;
    let errorContext = context || {};

    if (error instanceof Error) {
      stackTrace = error.stack;
      errorContext = {
        ...errorContext,
        errorName: error.name,
        errorMessage: error.message,
      };
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'critical',
      message,
      context: errorContext,
      stackTrace,
    };

    this.logToConsole(entry);
    this.logToDiscord(entry);
    this.logToSentry(entry);
  }

  /**
   * Log de acciones de checkout (auditoría)
   */
  public checkoutEvent(
    action: 'start' | 'validate' | 'process' | 'success' | 'failed',
    context: Record<string, unknown>
  ): void {
    this.info(`[CHECKOUT] ${action.toUpperCase()}`, context);
  }

  /**
   * Log de eventos de seguridad
   */
  public securityEvent(
    eventType: 'rate_limit' | 'csrf_fail' | 'ip_block' | 'vpn_detect' | 'suspicious_activity',
    context: Record<string, unknown>
  ): void {
    this.warn(`[SECURITY] ${eventType.toUpperCase()}`, context);
  }

  /**
   * Log de performance
   */
  public performanceMetric(
    metric: string,
    duration: number,
    context?: Record<string, unknown>
  ): void {
    this.info(`[PERF] ${metric}: ${duration}ms`, context);
  }
}

// Singleton global
export const logger = new Logger();
