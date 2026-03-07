const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export type FeedbackType = "error" | "sugerencia" | "comentario";

export interface FeedbackDiscordPayload {
  type: FeedbackType;
  name: string;
  email: string;
  message: string;
  orderId?: string | null;
  page?: string | null;
  clientIp: string;
  userAgent?: string | null;
}

export function isFeedbackWebhookConfigured(): boolean {
  return Boolean(DISCORD_WEBHOOK_URL);
}

function getTypeLabel(type: FeedbackType): string {
  if (type === "error") return "Error";
  if (type === "sugerencia") return "Sugerencia";
  return "Comentario";
}

function sanitizeInline(value: string, max = 120): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function sanitizeBlock(value: string, max = 1600): string {
  return String(value || "").trim().replace(/\u0000/g, "").slice(0, max);
}

export async function sendFeedbackToDiscord(
  payload: FeedbackDiscordPayload
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error("Discord webhook not configured.");
  }

  const typeLabel = getTypeLabel(payload.type);
  const safeName = sanitizeInline(payload.name);
  const safeEmail = sanitizeInline(payload.email);
  const safeOrderId = sanitizeInline(payload.orderId || "", 80);
  const safePage = sanitizeInline(payload.page || "", 240);
  const safeMessage = sanitizeBlock(payload.message);
  const safeUserAgent = sanitizeInline(payload.userAgent || "N/A", 240);
  const safeIp = sanitizeInline(payload.clientIp || "unknown", 80);

  const embed = {
    embeds: [
      {
        title: `Nuevo feedback: ${typeLabel}`,
        color:
          payload.type === "error"
            ? 0xef4444
            : payload.type === "sugerencia"
              ? 0x3b82f6
              : 0x10b981,
        fields: [
          {
            name: "Tipo",
            value: typeLabel,
            inline: true,
          },
          {
            name: "Nombre",
            value: safeName || "N/A",
            inline: true,
          },
          {
            name: "Email",
            value: safeEmail || "N/A",
            inline: false,
          },
          {
            name: "Mensaje",
            value: safeMessage || "Sin mensaje",
            inline: false,
          },
          ...(safeOrderId
            ? [
                {
                  name: "Pedido",
                  value: safeOrderId,
                  inline: true,
                },
              ]
            : []),
          ...(safePage
            ? [
                {
                  name: "Pagina",
                  value: safePage,
                  inline: true,
                },
              ]
            : []),
          {
            name: "Cliente",
            value: `IP: ${safeIp}\nUA: ${safeUserAgent}`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Vortixy - Feedback web",
        },
      },
    ],
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embed),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Discord webhook error ${response.status}: ${bodyText.slice(0, 300)}`);
  }
}

