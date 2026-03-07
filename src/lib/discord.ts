/**
 * Discord webhook notifications for Vortixy.
 * Sends order alerts plus admin action links (moderation and cancellation).
 */

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export function isDiscordConfigured(): boolean {
  return Boolean(DISCORD_WEBHOOK_URL);
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function getAppBaseUrl(): string {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "https://tu-tienda.vercel.app").trim();
  return appUrl.replace(/\/+$/, "");
}

function getAdminSecret(): string {
  return String(process.env.ADMIN_BLOCK_SECRET || process.env.ORDER_LOOKUP_SECRET || "").trim();
}

interface OrderDiscordPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDepartment: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    variant?: string | null;
  }>;
  clientIp: string;
  userAgent?: string;
}

export async function sendOrderToDiscord(payload: OrderDiscordPayload): Promise<void> {
  if (!isDiscordConfigured()) return;

  const appUrl = getAppBaseUrl();
  const adminSecret = getAdminSecret();

  const blockPermanentUrl = `${appUrl}/api/admin/block-ip?ip=${encodeURIComponent(payload.clientIp)}&duration=permanent&secret=${encodeURIComponent(adminSecret)}`;
  const block24hUrl = `${appUrl}/api/admin/block-ip?ip=${encodeURIComponent(payload.clientIp)}&duration=24h&secret=${encodeURIComponent(adminSecret)}`;
  const block1hUrl = `${appUrl}/api/admin/block-ip?ip=${encodeURIComponent(payload.clientIp)}&duration=1h&secret=${encodeURIComponent(adminSecret)}`;
  const cancelOrderUrl = `${appUrl}/api/admin/orders/cancel?order_id=${encodeURIComponent(payload.orderId)}&secret=${encodeURIComponent(adminSecret)}`;

  const itemsList = payload.items
    .map((item) => {
      const base = `- **${item.product_name}** x${item.quantity} - ${formatCop(item.price * item.quantity)}`;
      return item.variant ? `${base} (${item.variant})` : base;
    })
    .join("\n");

  const moderationLinks = [
    `[Bloquear IP permanente](${blockPermanentUrl})`,
    `[Bloquear IP 24 horas](${block24hUrl})`,
    `[Bloquear IP 1 hora](${block1hUrl})`,
  ].join("\n");

  const orderActions = adminSecret
    ? [
        `[Cancelar pedido en la app](${cancelOrderUrl})`,
        "Si ya esta en processing y tiene referencia Dropi, si puedes cancelarla en panel de Dropi, pero tu app hoy no tiene endpoint de cancelacion automatica a Dropi (es manual desde Dropi).",
      ].join("\n")
    : "Configura ADMIN_BLOCK_SECRET para habilitar links de cancelacion/seguridad desde Discord.";

  const embed = {
    embeds: [
      {
        title: `Nuevo Pedido #${payload.orderId.slice(0, 8).toUpperCase()}`,
        color: 0x10b981,
        fields: [
          {
            name: "Cliente",
            value:
              `**Nombre:** ${payload.customerName}\n` +
              `**Email:** ${payload.customerEmail}\n` +
              `**Telefono:** ${payload.customerPhone}\n` +
              `**Documento:** ${payload.customerDocument}`,
            inline: false,
          },
          {
            name: "Direccion de envio",
            value: `${payload.shippingAddress}\n${payload.shippingCity}, ${payload.shippingDepartment}`,
            inline: false,
          },
          {
            name: "Productos",
            value: itemsList || "Sin productos",
            inline: false,
          },
          {
            name: "Resumen",
            value:
              `**Subtotal:** ${formatCop(payload.subtotal)}\n` +
              `**Envio:** ${payload.shippingCost === 0 ? "Gratis" : formatCop(payload.shippingCost)}\n` +
              `**Total:** ${formatCop(payload.total)}`,
            inline: true,
          },
          {
            name: "Informacion tecnica",
            value:
              `**IP:** \`${payload.clientIp}\`\n` +
              `**User Agent:** \`${(payload.userAgent || "Desconocido").slice(0, 100)}\``,
            inline: false,
          },
          {
            name: "Acciones de moderacion",
            value: moderationLinks,
            inline: false,
          },
          {
            name: "Acciones de pedido",
            value: orderActions,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Vortixy - Sistema de pedidos",
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
      console.error("[Discord] Webhook error:", response.status, await response.text());
    }
  } catch (error) {
    console.error("[Discord] Webhook send failed:", error);
  }
}

export async function sendBlockNotificationToDiscord(
  ip: string,
  duration: string,
  reason: string
): Promise<void> {
  if (!isDiscordConfigured()) return;

  const embed = {
    embeds: [
      {
        title: "IP bloqueada",
        color: 0xef4444,
        fields: [
          { name: "IP", value: `\`${ip}\``, inline: true },
          { name: "Duracion", value: duration, inline: true },
          { name: "Razon", value: reason, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Vortixy - Sistema de seguridad" },
      },
    ],
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embed),
    });
  } catch (error) {
    console.error("[Discord] Block notification failed:", error);
  }
}

interface OrderCancellationDiscordPayload {
  orderId: string;
  statusBefore: string;
  outcome: "cancelled" | "manual_dropi_required" | "already_finalized" | "error";
  detail: string;
}

export async function sendOrderCancellationResultToDiscord(
  payload: OrderCancellationDiscordPayload
): Promise<void> {
  if (!isDiscordConfigured()) return;

  const colorByOutcome: Record<OrderCancellationDiscordPayload["outcome"], number> = {
    cancelled: 0xef4444,
    manual_dropi_required: 0xf59e0b,
    already_finalized: 0x6b7280,
    error: 0xdc2626,
  };

  const embed = {
    embeds: [
      {
        title: `Accion de cancelacion #${payload.orderId.slice(0, 8).toUpperCase()}`,
        color: colorByOutcome[payload.outcome],
        fields: [
          { name: "Estado previo", value: payload.statusBefore, inline: true },
          { name: "Resultado", value: payload.outcome, inline: true },
          { name: "Detalle", value: payload.detail, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Vortixy - Admin pedidos" },
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
        "[Discord] Cancellation notification error:",
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.error("[Discord] Cancellation notification failed:", error);
  }
}
