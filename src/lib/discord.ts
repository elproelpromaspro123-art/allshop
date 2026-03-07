/**
 * Discord Webhook Notifications for Vortixy
 * Sends order alerts to Discord with full info + moderation buttons
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
    items: Array<{ product_name: string; quantity: number; price: number; variant?: string | null }>;
    clientIp: string;
    userAgent?: string;
}

export async function sendOrderToDiscord(payload: OrderDiscordPayload): Promise<void> {
    if (!isDiscordConfigured()) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tu-tienda.vercel.app";
    const adminSecret =
        process.env.ADMIN_BLOCK_SECRET || process.env.ORDER_LOOKUP_SECRET || "";

    const blockPermanentUrl = `${appUrl}/api/admin/block-ip?ip=${encodeURIComponent(payload.clientIp)}&duration=permanent&secret=${encodeURIComponent(adminSecret)}`;
    const block24hUrl = `${appUrl}/api/admin/block-ip?ip=${encodeURIComponent(payload.clientIp)}&duration=24h&secret=${encodeURIComponent(adminSecret)}`;
    const block1hUrl = `${appUrl}/api/admin/block-ip?ip=${encodeURIComponent(payload.clientIp)}&duration=1h&secret=${encodeURIComponent(adminSecret)}`;

    const itemsList = payload.items
        .map(
            (item) =>
                `• **${item.product_name}** x${item.quantity} — ${formatCop(item.price * item.quantity)}${item.variant ? ` (${item.variant})` : ""}`
        )
        .join("\n");

    const embed = {
        embeds: [
            {
                title: `🛒 Nuevo Pedido #${payload.orderId.slice(0, 8).toUpperCase()}`,
                color: 0x10b981, // green
                fields: [
                    {
                        name: "👤 Cliente",
                        value: `**Nombre:** ${payload.customerName}\n**Email:** ${payload.customerEmail}\n**Teléfono:** ${payload.customerPhone}\n**Documento:** ${payload.customerDocument}`,
                        inline: false,
                    },
                    {
                        name: "📦 Dirección de Envío",
                        value: `${payload.shippingAddress}\n${payload.shippingCity}, ${payload.shippingDepartment}`,
                        inline: false,
                    },
                    {
                        name: "🛍️ Productos",
                        value: itemsList || "Sin productos",
                        inline: false,
                    },
                    {
                        name: "💰 Resumen",
                        value: `**Subtotal:** ${formatCop(payload.subtotal)}\n**Envío:** ${payload.shippingCost === 0 ? "Gratis" : formatCop(payload.shippingCost)}\n**Total:** ${formatCop(payload.total)}`,
                        inline: true,
                    },
                    {
                        name: "🌐 Información Técnica",
                        value: `**IP:** \`${payload.clientIp}\`\n**User Agent:** \`${(payload.userAgent || "Desconocido").slice(0, 100)}\``,
                        inline: false,
                    },
                    {
                        name: "🚨 Acciones de Moderación",
                        value: [
                            `[⛔ Bloquear IP Permanente](${blockPermanentUrl})`,
                            `[🕐 Bloquear IP 24 horas](${block24hUrl})`,
                            `[⏱️ Bloquear IP 1 hora](${block1hUrl})`,
                        ].join("\n"),
                        inline: false,
                    },
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Vortixy — Sistema de pedidos",
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
                title: "🚫 IP Bloqueada",
                color: 0xef4444, // red
                fields: [
                    { name: "IP", value: `\`${ip}\``, inline: true },
                    { name: "Duración", value: duration, inline: true },
                    { name: "Razón", value: reason, inline: false },
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "Vortixy — Sistema de seguridad" },
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
