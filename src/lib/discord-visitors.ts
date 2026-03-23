import { readEnvValue } from "@/lib/env";

/**
 * Discord webhook notifications for real human visitors.
 * Filters out bots, crawlers, and suspicious traffic.
 */

const DISCORD_WEBHOOK_URL = readEnvValue("DISCORD_WEBHOOK_URL");
const VISITOR_ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const visitorAlertMemory = new Map<string, number>();

export function isDiscordConfigured(): boolean {
  return Boolean(DISCORD_WEBHOOK_URL);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ""}`;
}

function getBotRiskLevel(score: number): "Bajo" | "Medio" | "Alto" | "Crítico" {
  if (score < 20) return "Bajo";
  if (score < 40) return "Medio";
  if (score < 60) return "Alto";
  return "Crítico";
}

function getRiskColor(level: string): number {
  switch (level) {
    case "Bajo":
      return 0x10b981; // Green
    case "Medio":
      return 0xf59e0b; // Amber
    case "Alto":
      return 0xf97316; // Orange
    case "Crítico":
      return 0xef4444; // Red
    default:
      return 0x6b7280; // Gray
  }
}

function getPageTitle(path: string): string {
  if (path === "/") return "Inicio";
  if (path.startsWith("/producto/")) {
    const slug = path.replace("/producto/", "");
    return `Producto: ${slug}`;
  }
  if (path.startsWith("/categoria/")) {
    const slug = path.replace("/categoria/", "");
    return `Categoría: ${slug}`;
  }
  if (path === "/checkout") return "Checkout";
  if (path === "/soporte") return "Soporte";
  if (path === "/faq") return "FAQ";
  return path;
}

interface VisitorDiscordPayload {
  ip: string;
  userAgent: string;
  path: string;
  referrer: string | null;
  sessionId: string;
  pageViews: number;
  paths: string[];
  sessionDuration: number;
  botScore: number;
}

export async function sendVisitorAlertToDiscord(
  payload: VisitorDiscordPayload,
): Promise<void> {
  if (!isDiscordConfigured()) return;

  const ip = payload.ip || "unknown";
  const key = `visitor:${ip}`;
  const now = Date.now();
  const lastSentAt = visitorAlertMemory.get(key) || 0;

  // Respect cooldown
  if (now - lastSentAt < VISITOR_ALERT_COOLDOWN_MS) {
    return;
  }

  visitorAlertMemory.set(key, now);

  const riskLevel = getBotRiskLevel(payload.botScore);
  const riskColor = getRiskColor(riskLevel);
  
  const sessionDuration = formatDuration(payload.sessionDuration);
  const pageViews = payload.pageViews;
  
  // Build paths visited list
  const pathsList = payload.paths
    .slice(0, 8) // Max 8 paths
    .map((p, i) => `${i + 1}. ${getPageTitle(p)}`)
    .join("\n");

  // Extract browser info from UA
  const browserInfo = extractBrowserInfo(payload.userAgent);
  
  // Check if this is a returning visitor
  const isReturning = payload.pageViews > 1;

  const embed = {
    embeds: [
      {
        title: `👁️ Visitante ${isReturning ? "Recurrente" : "Nuevo"} Detectado`,
        color: riskColor,
        fields: [
          {
            name: "🌐 Navegador / Dispositivo",
            value: 
              `**Browser:** ${browserInfo.browser || "Desconocido"}\n` +
              `**OS:** ${browserInfo.os || "Desconocido"}\n` +
              `**Device:** ${browserInfo.device || "Desktop"}`,
            inline: true,
          },
          {
            name: "📊 Riesgo de Bot",
            value:
              `**Nivel:** ${riskLevel}\n` +
              `**Score:** ${payload.botScore}/100\n` +
              `**IP:** \`${ip}\``,
            inline: true,
          },
          {
            name: "⏱️ Sesión",
            value:
              `**Duración:** ${sessionDuration}\n` +
              `**Page Views:** ${pageViews}\n` +
              `**Paths:** ${payload.paths.length}`,
            inline: true,
          },
          {
            name: "📍 Páginas Visitadas",
            value: pathsList || "Sin registro",
            inline: false,
          },
          {
            name: "🔗 Referrer",
            value: payload.referrer 
              ? truncate(payload.referrer, 200) 
              : "Directo / Sin referrer",
            inline: false,
          },
          {
            name: " Session ID",
            value: `\`${payload.sessionId.slice(0, 32)}...\``,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Vortixy - Monitor de Visitantes Reales",
        },
        thumbnail: {
          url: isReturning 
            ? "https://cdn-icons-png.flaticon.com/512/2921/2921226.png" 
            : "https://cdn-icons-png.flaticon.com/512/2921/2921223.png",
        },
      },
    ],
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed),
    });

    if (!response.ok) {
      console.error(
        "[Discord] Visitor alert error:",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("[Discord] Visitor alert failed:", error);
  }
}

function extractBrowserInfo(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  const ua = userAgent || "";
  
  // Browser detection
  let browser = "Desconocido";
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browser = ua.includes("Mobile") ? "Chrome Mobile" : "Chrome";
  } else if (ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
  } else if (ua.includes("MSIE") || ua.includes("Trident")) {
    browser = "Internet Explorer";
  }
  
  // OS detection
  let os = "Desconocido";
  if (ua.includes("Windows NT 10")) {
    os = "Windows 10/11";
  } else if (ua.includes("Windows NT 6.1")) {
    os = "Windows 7";
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
    const version = ua.match(/Mac OS X ([0-9_]+)/);
    if (version) {
      os = `macOS ${version[1].replace(/_/g, ".")}`;
    }
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  }
  
  // Device detection
  let device = "Desktop";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    device = "Mobile";
  } else if (ua.includes("Tablet") || ua.includes("iPad")) {
    device = "Tablet";
  }
  
  return { browser, os, device };
}
