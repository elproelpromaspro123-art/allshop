/**
 * Discord webhook notifications for Vortixy.
 * Sends order alerts with secure admin action commands.
 */

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const LOW_STOCK_ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const lowStockAlertMemory = new Map<string, number>();

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

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatDateTime(value: string | null | undefined): string {
  const parsed = new Date(String(value || ""));
  if (Number.isNaN(parsed.getTime())) return "N/D";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(parsed);
}

function getAppBaseUrl(): string {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "https://vortixy.net").trim();
  return appUrl.replace(/\/+$/, "");
}

interface OrderDiscordPayload {
  orderId: string;
  createdAt?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  shippingAddress: string;
  shippingReference?: string | null;
  shippingCity: string;
  shippingDepartment: string;
  shippingZip?: string | null;
  carrierCode?: string | null;
  carrierName?: string | null;
  carrierInsured?: boolean;
  etaMinDays?: number | null;
  etaMaxDays?: number | null;
  etaRange?: string | null;
  total: number;
  subtotal: number;
  shippingCost: number;
  checkoutModel?: string;
  fulfillmentMode?: string;
  manualDispatchRequired?: boolean;
  items: Array<{
    product_id?: string;
    slug?: string | null;
    product_name: string;
    quantity: number;
    price: number;
    variant?: string | null;
    image?: string | null;
  }>;
  clientIp: string;
  userAgent?: string;
}

export async function sendOrderToDiscord(payload: OrderDiscordPayload): Promise<void> {
  if (!isDiscordConfigured()) return;

  const appUrl = getAppBaseUrl();

  const createdAt = formatDateTime(payload.createdAt || new Date().toISOString());

  const itemsList = payload.items
    .map((item, index) => {
      const lineTotal = item.price * item.quantity;
      const variant = item.variant ? ` | Variante: ${item.variant}` : "";
      const slugInfo = item.slug ? ` | slug: ${item.slug}` : "";
      return `${index + 1}. ${item.product_name}${variant}${slugInfo}\n   Cant: ${item.quantity} | Unit: ${formatCop(item.price)} | Subtotal: ${formatCop(lineTotal)}`;
    })
    .join("\n");

  const moderationCommands = [
    "Bloquear IP permanente:",
    `curl -X POST "${appUrl}/api/admin/block-ip" -H "Authorization: Bearer <ADMIN_SECRET>" -H "Content-Type: application/json" -d "{\\"ip\\":\\"${payload.clientIp}\\",\\"duration\\":\\"permanent\\",\\"action\\":\\"block\\"}"`,
    "",
    "Bloquear IP 24 horas:",
    `curl -X POST "${appUrl}/api/admin/block-ip" -H "Authorization: Bearer <ADMIN_SECRET>" -H "Content-Type: application/json" -d "{\\"ip\\":\\"${payload.clientIp}\\",\\"duration\\":\\"24h\\",\\"action\\":\\"block\\"}"`,
    "",
    "Desbloquear IP:",
    `curl -X POST "${appUrl}/api/admin/block-ip" -H "Authorization: Bearer <ADMIN_SECRET>" -H "Content-Type: application/json" -d "{\\"ip\\":\\"${payload.clientIp}\\",\\"action\\":\\"unblock\\"}"`,
  ].join("\n");

  const orderActions = [
    "Cancelar pedido:",
    `curl -X POST "${appUrl}/api/admin/orders/cancel" -H "Authorization: Bearer <ADMIN_SECRET>" -H "Content-Type: application/json" -d "{\\"order_id\\":\\"${payload.orderId}\\"}"`,
    "",
    "Válido solo para estados: pending, paid, processing.",
  ].join("\n");

  const shippingSummary = [
    `Dirección: ${payload.shippingAddress}`,
    payload.shippingReference ? `Referencia: ${payload.shippingReference}` : null,
    `Ciudad/Depto: ${payload.shippingCity}, ${payload.shippingDepartment}`,
    payload.shippingZip ? `ZIP: ${payload.shippingZip}` : null,
    payload.carrierName
      ? `Transportadora sugerida: ${payload.carrierName}${payload.carrierInsured ? " (asegurada)" : " (estándar)"}`
      : null,
    payload.etaRange
      ? `ETA: ${payload.etaRange}${typeof payload.etaMinDays === "number" && typeof payload.etaMaxDays === "number"
        ? ` (${payload.etaMinDays}-${payload.etaMaxDays} días hábiles)`
        : ""
      }`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const orderMeta = [
    `Pedido: ${payload.orderId}`,
    `Creado: ${createdAt}`,
    `Modelo checkout: ${payload.checkoutModel || "manual_cod_v1"}`,
    `Despacho: ${payload.fulfillmentMode || "manual_dispatch"}`,
    `Requiere gestión manual: ${payload.manualDispatchRequired === false ? "No" : "Sí"}`,
  ].join("\n");

  const humanChecklist = [
    "1) Confirmar teléfono y documento del cliente.",
    "2) Verificar dirección completa y referencia de entrega.",
    "3) Registrar variantes y cantidades exactas.",
    "4) Verificar total y observaciones antes de enviar.",
  ].join("\n");

  const embed = {
    embeds: [
      {
        title: `Nuevo Pedido #${payload.orderId.slice(0, 8).toUpperCase()}`,
        color: 0x10b981,
        fields: [
          {
            name: "Cliente y contacto",
            value:
              `**Nombre:** ${payload.customerName}\n` +
              `**Email:** ${payload.customerEmail}\n` +
              `**Teléfono:** ${payload.customerPhone}\n` +
              `**Documento:** ${payload.customerDocument}`,
            inline: false,
          },
          {
            name: "Resumen operativo",
            value: truncate(orderMeta, 1024),
            inline: false,
          },
          {
            name: "Envío / Logística",
            value: truncate(shippingSummary || "Sin datos de logística", 1024),
            inline: false,
          },
          {
            name: "Productos (registro interno)",
            value: truncate(itemsList || "Sin productos", 1024),
            inline: false,
          },
          {
            name: "Cobro",
            value:
              `**Subtotal:** ${formatCop(payload.subtotal)}\n` +
              `**Envio:** ${payload.shippingCost === 0 ? "Gratis" : formatCop(payload.shippingCost)}\n` +
              `**Total:** ${formatCop(payload.total)}`,
            inline: true,
          },
          {
            name: "Checklist manual",
            value: truncate(humanChecklist, 1024),
            inline: true,
          },
          {
            name: "Información técnica",
            value:
              `**IP:** \`${payload.clientIp}\`\n` +
              `**User Agent:** \`${truncate(payload.userAgent || "Desconocido", 220)}\``,
            inline: false,
          },
          {
            name: "Acciones de moderación",
            value: truncate(moderationCommands, 1024),
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
          { name: "Duración", value: duration, inline: true },
          { name: "Razón", value: reason, inline: false },
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
  outcome: "cancelled" | "already_finalized" | "error";
  detail: string;
}

export async function sendOrderCancellationResultToDiscord(
  payload: OrderCancellationDiscordPayload
): Promise<void> {
  if (!isDiscordConfigured()) return;

  const colorByOutcome: Record<OrderCancellationDiscordPayload["outcome"], number> = {
    cancelled: 0xef4444,
    already_finalized: 0x6b7280,
    error: 0xdc2626,
  };

  const embed = {
    embeds: [
      {
        title: `Acción de cancelación #${payload.orderId.slice(0, 8).toUpperCase()}`,
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

interface LowStockDiscordPayload {
  slug: string;
  productName: string;
  variant?: string | null;
  stock: number;
  threshold: number;
  updatedBy?: string | null;
}

export async function sendLowStockAlertToDiscord(
  payload: LowStockDiscordPayload
): Promise<void> {
  if (!isDiscordConfigured()) return;

  const variantLabel = String(payload.variant || "").trim() || "TOTAL";
  const key = `${payload.slug}::${variantLabel}`.toLowerCase();
  const now = Date.now();
  const lastSentAt = lowStockAlertMemory.get(key) || 0;

  if (now - lastSentAt < LOW_STOCK_ALERT_COOLDOWN_MS) {
    return;
  }

  lowStockAlertMemory.set(key, now);

  const embed = {
    embeds: [
      {
        title: "Alerta de stock bajo",
        color: 0xf59e0b,
        fields: [
          { name: "Producto", value: payload.productName, inline: false },
          { name: "Slug", value: `\`${payload.slug}\``, inline: false },
          { name: "Variante", value: variantLabel, inline: true },
          { name: "Stock actual", value: String(payload.stock), inline: true },
          { name: "Umbral", value: String(payload.threshold), inline: true },
          {
            name: "Actualizado por",
            value: String(payload.updatedBy || "sistema"),
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Vortixy - Monitoreo de inventario" },
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
      console.error("[Discord] Low stock notification error:", response.status);
    }
  } catch (error) {
    console.error("[Discord] Low stock notification failed:", error);
  }
}
