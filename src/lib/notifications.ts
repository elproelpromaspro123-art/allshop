import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import type { OrderStatus } from "@/types/database";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || "AllShop <onboarding@resend.dev>";

function canSendEmail(): boolean {
  return Boolean(resendApiKey);
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function notifyOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id,customer_name,customer_email,total,status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || !order.customer_email) return;

  const statusLabel = STATUS_LABELS[status] || status;
  const subject = `AllShop: tu pedido #${order.id.slice(0, 8)} esta ${statusLabel.toLowerCase()}`;
  const firstName = order.customer_name.split(" ")[0] || "cliente";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <h2 style="margin-bottom:8px">Hola ${firstName},</h2>
      <p>Tu pedido <strong>#${order.id.slice(0, 8)}</strong> cambio de estado.</p>
      <p>Estado actual: <strong>${statusLabel}</strong></p>
      <p>Total: <strong>${formatCop(order.total)}</strong></p>
      <p style="margin-top:24px">Gracias por comprar en AllShop.</p>
    </div>
  `;

  const text = [
    `Hola ${firstName},`,
    `Tu pedido #${order.id.slice(0, 8)} cambio de estado.`,
    `Estado actual: ${statusLabel}`,
    `Total: ${formatCop(order.total)}`,
    "Gracias por comprar en AllShop.",
  ].join("\n");

  await sendEmail(order.customer_email, subject, html, text);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  if (!canSendEmail()) {
    console.log("[Notifications] RESEND_API_KEY not configured. Skipping email.");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [to],
        subject,
        html,
        text,
      }),
    });
  } catch (error) {
    console.error("[Notifications] Error sending email:", error);
  }
}
