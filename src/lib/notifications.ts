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

export function isResendConfigured(): boolean {
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

export async function sendOrderVerificationEmail(input: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  verificationCode: string;
  verificationUrl: string;
  etaRange: string;
}): Promise<void> {
  const to = String(input.customerEmail || "").trim().toLowerCase();
  if (!to) return;

  const firstName = String(input.customerName || "cliente").trim().split(" ")[0] || "cliente";
  const orderRef = String(input.orderId || "").slice(0, 8).toUpperCase();
  const code = String(input.verificationCode || "").replace(/\D+/g, "");
  const codeSafe = code || "------";
  const etaRange = String(input.etaRange || "").trim() || "2 a 7 dias habiles";
  const warning =
    "Pedir pedidos en forma de broma no es eticamente moral y puede llegar a consecuencias que seran medidas que tomaremos contra usted.";

  const subject = `Vortixy: confirma tu pedido #${orderRef} con el codigo`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.55">
      <h2 style="margin:0 0 10px">Hola ${firstName},</h2>
      <p>Recibimos tu pedido <strong>#${orderRef}</strong> por <strong>${formatCop(
    input.total
  )}</strong>.</p>
      <p>Para confirmarlo de forma definitiva debes ingresar este codigo:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:8px 0 14px">${codeSafe}</p>
      <p>Ingresa al siguiente enlace para validar el codigo:</p>
      <p><a href="${input.verificationUrl}" target="_blank" rel="noreferrer noopener">${
    input.verificationUrl
  }</a></p>
      <p>Entrega estimada: <strong>${etaRange}</strong>.</p>
      <p style="margin-top:18px;padding:12px;border-radius:8px;background:#fff3cd;border:1px solid #ffe69c;color:#664d03">
        <strong>Advertencia:</strong> ${warning}
      </p>
      <p style="margin-top:20px">Si no hiciste este pedido, ignora este correo.</p>
    </div>
  `;

  const text = [
    `Hola ${firstName},`,
    `Recibimos tu pedido #${orderRef} por ${formatCop(input.total)}.`,
    "",
    `Codigo de confirmacion: ${codeSafe}`,
    `Valida tu pedido en: ${input.verificationUrl}`,
    `Entrega estimada: ${etaRange}.`,
    "",
    `Advertencia: ${warning}`,
    "",
    "Si no hiciste este pedido, ignora este correo.",
  ].join("\n");

  await sendEmail(to, subject, html, text);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  if (!isResendConfigured()) {
    throw new Error("RESEND_API_KEY not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Resend API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.slice(0, 200)}` : ""}`
    );
  }
}
