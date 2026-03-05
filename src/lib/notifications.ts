import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import {
  buildWhatsAppTrackingMessage,
  isWhatsAppMessagingConfigured,
  sendWhatsAppTextMessage,
} from "./whatsapp";
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
    .select("id,customer_name,customer_email,customer_phone,total,status,notes")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

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

  if (order.customer_email) {
    await sendEmail(order.customer_email, subject, html, text);
  }

  await sendTrackingWhatsAppUpdate({
    orderId: order.id,
    customerPhone: order.customer_phone,
    statusLabel,
    trackingCode,
    notes: order.notes,
  });
}

function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;

  if (!Array.isArray(candidates)) return null;

  const first = candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 4
  );
  return typeof first === "string" ? first.trim() : null;
}

function extractLastTrackingWhatsAppCode(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const notifications = getRecord(parsed.notifications);
  const value = notifications.whatsapp_tracking_sent_code;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function parseNotes(rawNotes: string | null): Record<string, unknown> {
  if (!rawNotes) return {};

  try {
    const parsed = JSON.parse(rawNotes) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { previous_notes: rawNotes };
  } catch {
    return { previous_notes: rawNotes };
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mergeTrackingNotificationNotes(
  previousNotes: string | null,
  trackingCode: string
): string {
  const notes = parseNotes(previousNotes);
  const notifications = getRecord(notes.notifications);

  notes.notifications = {
    ...notifications,
    whatsapp_tracking_sent_code: trackingCode,
    whatsapp_tracking_sent_at: new Date().toISOString(),
  };

  return JSON.stringify(notes);
}

async function markTrackingWhatsAppSent(input: {
  orderId: string;
  previousNotes: string | null;
  trackingCode: string;
}): Promise<void> {
  const nextNotes = mergeTrackingNotificationNotes(
    input.previousNotes,
    input.trackingCode
  );

  let query = supabaseAdmin
    .from("orders")
    .update({ notes: nextNotes })
    .eq("id", input.orderId);

  if (input.previousNotes === null) {
    query = query.is("notes", null);
  } else {
    query = query.eq("notes", input.previousNotes);
  }

  const { error } = await query;
  if (error) {
    console.error("[Notifications] Error marking WhatsApp tracking update:", error);
  }
}

async function sendTrackingWhatsAppUpdate(input: {
  orderId: string;
  customerPhone: string | null;
  statusLabel: string;
  trackingCode: string | null;
  notes: string | null;
}): Promise<void> {
  if (!input.trackingCode) return;
  if (!input.customerPhone) return;
  if (!isWhatsAppMessagingConfigured()) return;

  const alreadySentCode = extractLastTrackingWhatsAppCode(input.notes);
  if (alreadySentCode === input.trackingCode) return;

  try {
    await sendWhatsAppTextMessage({
      to: input.customerPhone,
      body: buildWhatsAppTrackingMessage({
        orderId: input.orderId,
        trackingCode: input.trackingCode,
        statusLabel: input.statusLabel,
      }),
    });
  } catch (error) {
    console.error("[Notifications] Error sending tracking WhatsApp:", error);
    return;
  }

  await markTrackingWhatsAppSent({
    orderId: input.orderId,
    previousNotes: input.notes,
    trackingCode: input.trackingCode,
  });
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
