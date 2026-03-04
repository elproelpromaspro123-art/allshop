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
const resendFrom = process.env.RESEND_FROM_EMAIL || "Vortixy <onboarding@resend.dev>";

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
    .select("id,customer_name,customer_email,total,status,notes")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || !order.customer_email) return;

  const statusLabel = STATUS_LABELS[status] || status;
  const subject = `Vortixy: tu pedido #${order.id.slice(0, 8)} esta ${statusLabel.toLowerCase()}`;
  const firstName = order.customer_name.split(" ")[0] || "cliente";
  const trackingCode = extractTrackingCode(order.notes);

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <h2 style="margin-bottom:8px">Hola ${firstName},</h2>
      <p>Tu pedido <strong>#${order.id.slice(0, 8)}</strong> cambio de estado.</p>
      <p>Estado actual: <strong>${statusLabel}</strong></p>
      ${trackingCode ? `<p>Guia de seguimiento: <strong>${trackingCode}</strong></p>` : ""}
      <p>Total: <strong>${formatCop(order.total)}</strong></p>
      <p style="margin-top:24px">Gracias por comprar en Vortixy.</p>
    </div>
  `;

  const text = [
    `Hola ${firstName},`,
    `Tu pedido #${order.id.slice(0, 8)} cambio de estado.`,
    `Estado actual: ${statusLabel}`,
    trackingCode ? `Guia de seguimiento: ${trackingCode}` : "",
    `Total: ${formatCop(order.total)}`,
    "Gracias por comprar en Vortixy.",
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail(order.customer_email, subject, html, text);
}

function extractTrackingCode(notes: string | null): string | null {
  if (!notes) return null;

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    const fulfillment = parsed.fulfillment as Record<string, unknown> | undefined;
    if (!fulfillment || typeof fulfillment !== "object") return null;

    const candidates = fulfillment.tracking_candidates;
    if (!Array.isArray(candidates)) return null;

    const first = candidates.find(
      (value) => typeof value === "string" && value.trim().length >= 4
    );
    return typeof first === "string" ? first.trim() : null;
  } catch {
    return null;
  }
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

