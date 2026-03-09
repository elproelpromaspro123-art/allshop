import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import type { OrderStatus } from "@/types/database";
import nodemailer from "nodemailer";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const emailFrom =
  process.env.EMAIL_FROM || "Vortixy <vortixyoficial@gmail.com>";

export function isEmailConfigured(): boolean {
  return Boolean(smtpUser && smtpPass);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

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

  if (!order) return;

  const statusLabel = STATUS_LABELS[status] || status;
  const subject = `Vortixy: actualizacion de tu pedido #${order.id.slice(0, 8)}`;
  const firstName = order.customer_name.split(" ")[0] || "cliente";
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchReference = extractDispatchReference(order.notes);
  const customerNote = extractCustomerNote(order.notes);
  const manualReview = extractManualReview(order.notes);

  const statusSection = status !== order.status 
    ? `<p>Estado actualizado a: <strong>${statusLabel}</strong></p>`
    : `<p>Estado: <strong>${statusLabel}</strong></p>`;

  const manualReviewSection = manualReview.completed
    ? `<p style="color:#059669">✓ Tu pedido fue revisado y aprobado manualmente por nuestro equipo.</p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <h2 style="margin-bottom:8px">Hola ${firstName},</h2>
      <p>Tu pedido <strong>#${order.id.slice(0, 8)}</strong> tiene una actualizacion.</p>
      ${statusSection}
      ${manualReviewSection}
      ${dispatchReference ? `<p>Referencia interna de despacho: <strong>${dispatchReference}</strong></p>` : ""}
      ${trackingCode ? `<p>Guia de seguimiento: <strong>${trackingCode}</strong></p>` : ""}
      ${customerNote ? `<p style="background:#f3f4f6;padding:12px;border-radius:8px;margin-top:16px"><strong>Mensaje del equipo:</strong><br/>${customerNote}</p>` : ""}
      <p style="margin-top:16px">Total: <strong>${formatCop(order.total)}</strong></p>
      <p style="margin-top:24px">Gracias por comprar en Vortixy.</p>
    </div>
  `;

  const text = [
    `Hola ${firstName},`,
    `Tu pedido #${order.id.slice(0, 8)} tiene una actualizacion.`,
    `Estado: ${statusLabel}`,
    manualReview.completed ? "✓ Tu pedido fue revisado y aprobado manualmente por nuestro equipo." : "",
    dispatchReference ? `Referencia interna de despacho: ${dispatchReference}` : "",
    trackingCode ? `Guia de seguimiento: ${trackingCode}` : "",
    customerNote ? `Mensaje del equipo: ${customerNote}` : "",
    `Total: ${formatCop(order.total)}`,
    "Gracias por comprar en Vortixy.",
  ]
    .filter(Boolean)
    .join("\n");

  if (order.customer_email) {
    await sendEmail(order.customer_email, subject, html, text);
  }
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

function extractDispatchReference(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const references = fulfillment.provider_order_references;

  if (!Array.isArray(references)) return null;

  const first = references.find(
    (value) => typeof value === "string" && value.trim().length >= 3
  );
  return typeof first === "string" ? first.trim() : null;
}

function extractCustomerNote(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const customerUpdates = getRecord(parsed.customer_updates);
  const note = String(customerUpdates.latest_note || "").trim();
  return note || null;
}

function extractManualReview(notes: string | null): { completed: boolean; completedAt: string | null } {
  const parsed = parseNotes(notes);
  const manualReview = getRecord(parsed.manual_review);
  const completed = manualReview.completed === true;
  const completedAt = typeof manualReview.completed_at === "string" ? manualReview.completed_at : null;
  return { completed, completedAt };
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

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("SMTP credentials not configured.");
  }

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw new Error(`Email sending failed: ${error}`);
  }
}
