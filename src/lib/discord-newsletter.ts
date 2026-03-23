import { readEnvValue } from "@/lib/env";

/**
 * Discord webhook notifications for newsletter subscriptions.
 */

const DISCORD_WEBHOOK_URL = readEnvValue("DISCORD_WEBHOOK_URL");

export function isDiscordConfigured(): boolean {
  return Boolean(DISCORD_WEBHOOK_URL);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function extractEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : "desconocido";
}

function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    "throwaway.email",
    "mailinator.com",
    "temp-mail.org",
    "fakeinbox.com",
  ];
  
  const domain = extractEmailDomain(email.toLowerCase());
  return disposableDomains.some((d) => domain.includes(d));
}

function getEmailRiskLevel(email: string, ip: string): "Bajo" | "Medio" | "Alto" {
  if (isDisposableEmail(email)) return "Alto";
  if (ip === "unknown" || ip.includes("10.") || ip.includes("192.168.")) {
    return "Medio";
  }
  return "Bajo";
}

function getRiskColor(level: string): number {
  switch (level) {
    case "Bajo":
      return 0x10b981; // Green
    case "Medio":
      return 0xf59e0b; // Amber
    case "Alto":
      return 0xef4444; // Red
    default:
      return 0x6b7280; // Gray
  }
}

function extractBrowserInfo(userAgent: string): string {
  const ua = userAgent || "";
  
  if (ua.includes("Mobile")) {
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("Android")) return "Android Mobile";
  }
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  
  return "Desktop";
}

interface NewsletterSubscriptionDiscordPayload {
  email: string;
  ip: string;
  userAgent: string | null;
  path: string | null;
}

export async function sendNewsletterSubscriptionToDiscord(
  payload: NewsletterSubscriptionDiscordPayload,
): Promise<void> {
  if (!isDiscordConfigured()) return;

  const emailDomain = extractEmailDomain(payload.email);
  const isDisposable = isDisposableEmail(payload.email);
  const riskLevel = getEmailRiskLevel(payload.email, payload.ip);
  const riskColor = getRiskColor(riskLevel);
  
  const browserInfo = extractBrowserInfo(payload.userAgent || "");
  
  // Extract UTM parameters from path if present
  const urlParams = payload.path ? new URL(payload.path, "https://vortixy.net").searchParams : null;
  const utmSource = urlParams?.get("utm_source") || "Directo";
  const utmMedium = urlParams?.get("utm_medium") || "Orgánico";
  const utmCampaign = urlParams?.get("utm_campaign") || "Sin campaña";

  const embed = {
    embeds: [
      {
        title: "📧 Nueva Suscripción al Newsletter",
        color: riskColor,
        fields: [
          {
            name: "Email",
            value: `\`${payload.email}\``,
            inline: false,
          },
          {
            name: "Dominio",
            value: emailDomain,
            inline: true,
          },
          {
            name: "Tipo",
            value: isDisposable ? "⚠️ Desechable" : "✅ Válido",
            inline: true,
          },
          {
            name: "Riesgo",
            value: riskLevel,
            inline: true,
          },
          {
            name: "Dispositivo",
            value: browserInfo,
            inline: true,
          },
          {
            name: "IP",
            value: `\`${payload.ip}\``,
            inline: true,
          },
          {
            name: "Origen del Tráfico",
            value: 
              `**UTM Source:** ${utmSource}\n` +
              `**UTM Medium:** ${utmMedium}\n` +
              `**UTM Campaign:** ${utmCampaign || "N/A"}`,
            inline: false,
          },
          {
            name: "Referrer",
            value: payload.path 
              ? truncate(payload.path, 200) 
              : "Desconocido",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Vortixy - Newsletter Subscriptions",
        },
        thumbnail: {
          url: isDisposable
            ? "https://cdn-icons-png.flaticon.com/512/564/564619.png"
            : "https://cdn-icons-png.flaticon.com/512/732/732200.png",
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
        "[Discord] Newsletter subscription error:",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("[Discord] Newsletter subscription failed:", error);
  }
}
