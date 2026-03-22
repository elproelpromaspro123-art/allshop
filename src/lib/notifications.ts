import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import type { OrderStatus, OrderItem } from "@/types/database";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getConfiguredAppUrl, readEnvValue } from "@/lib/env";
import { escapeHtml } from "@/lib/utils";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  paid: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  processing: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  shipped: { bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" },
  delivered: { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
  cancelled: { bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" },
  refunded: { bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" },
};

const smtpUser = readEnvValue("SMTP_USER");
const smtpPass = readEnvValue("SMTP_PASSWORD");
const emailFrom = readEnvValue("EMAIL_FROM") || "Vortixy <vortixyoficial@gmail.com>";

export function isEmailConfigured(): boolean {
  return Boolean(smtpUser && smtpPass);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
} as SMTPTransport.Options);

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMultiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function getAppUrl(): string | null {
  const raw = String(getConfiguredAppUrl() || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getNextStepText(
  status: OrderStatus,
  trackingCode: string | null,
): string {
  if (status === "pending" || status === "paid") {
    return "Estamos validando tu pedido. Te avisaremos cuando pase a preparaci\u00f3n.";
  }
  if (status === "processing") {
    return "Estamos preparando tu despacho. Pronto recibir\u00e1s la gu\u00eda.";
  }
  if (status === "shipped") {
    return trackingCode
      ? "Tu pedido est\u00e1 en tr\u00e1nsito. Revisa la gu\u00eda para ver el avance."
      : "Tu pedido est\u00e1 en tr\u00e1nsito. La gu\u00eda se reflejar\u00e1 pronto.";
  }
  if (status === "delivered") {
    return "Pedido entregado. \u00a1Gracias por tu compra!";
  }
  if (status === "cancelled") {
    return "Pedido cancelado. Si necesitas ayuda, responde este correo.";
  }
  if (status === "refunded") {
    return "Reembolso procesado. Si tienes dudas, responde este correo.";
  }
  return "Te mantendremos informado sobre cualquier cambio.";
}

export async function notifyOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  const { data: order } = (await supabaseAdmin
    .from("orders")
    .select("id,customer_name,customer_email,total,status,notes,items")
    .eq("id", orderId)
    .maybeSingle()) as {
    data: {
      id: string;
      customer_name: string;
      customer_email: string;
      total: number;
      status: string;
      notes: string | null;
      items: unknown;
    } | null;
  };

  if (!order) return;

  const orderShortId = order.id.slice(0, 8).toUpperCase();
  const statusLabel = STATUS_LABELS[status] || status;
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const subject = (() => {
    if (status === "pending" || status === "paid") {
      return `Vortixy: Pedido recibido #${orderShortId}`;
    }
    if (status === "processing") {
      return `Vortixy: Pedido en preparaci\u00f3n #${orderShortId}`;
    }
    if (status === "shipped") {
      return `Vortixy: Tu pedido va en camino #${orderShortId}`;
    }
    if (status === "delivered") {
      return `Vortixy: Pedido entregado #${orderShortId}`;
    }
    if (status === "cancelled") {
      return `Vortixy: Pedido cancelado #${orderShortId}`;
    }
    if (status === "refunded") {
      return `Vortixy: Reembolso procesado #${orderShortId}`;
    }
    return `Vortixy: Actualizaci\u00f3n de tu pedido #${orderShortId}`;
  })();

  const firstName = escapeHtml(order.customer_name.split(" ")[0] || "cliente");
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchReference = extractDispatchReference(order.notes);
  const customerNote = extractCustomerNote(order.notes);
  const manualReview = extractManualReview(order.notes);
  const appUrl = getAppUrl();
  const nextStepText = getNextStepText(status, trackingCode);
  const trackingLink = appUrl ? `${appUrl}/seguimiento` : null;

  const brand = {
    accent: "#00c97b",
    accentStrong: "#008f58",
    accentDark: "#0b3b2a",
    accentSoft: "#ecfdf5",
    accentText: "#065f46",
  };

  const statusPill = `
    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${statusStyle.bg};color:${statusStyle.text};border:1px solid ${statusStyle.border};font-size:12px;font-weight:700;letter-spacing:0.02em;">
      ${statusLabel}
    </span>
  `;

  const manualReviewSection = manualReview.completed
    ? `<p style="margin:8px 0 0;color:#059669;font-size:13px;">\u2713 Revisi\u00f3n manual completada por nuestro equipo.</p>`
    : "";

  const itemsArray = Array.isArray(order.items)
    ? (order.items as unknown as OrderItem[])
    : [];

  const itemsHtml =
    itemsArray.length > 0
      ? `
      <div style="margin:20px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;">
        <h3 style="margin:0 0 10px;font-size:15px;color:#111827;">&#128230; Productos</h3>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th align="left" style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">Producto</th>
              <th align="center" style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">Cant.</th>
              <th align="right" style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsArray
              .map(
                (item) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <strong style="display:block;margin-bottom:2px;color:#111827;">${escapeHtml(item.product_name)}</strong>
                  ${item.variant ? `<span style="color:#6b7280;">Variante: ${escapeHtml(item.variant)}</span><br>` : ""}
                </td>
                <td align="center" style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${item.quantity}</td>
                <td align="right" style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:600;">
                  ${formatCop(item.price * item.quantity)}
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
      : "";

  const itemsText =
    itemsArray.length > 0
      ? "\nProductos:\n" +
        itemsArray
          .map(
            (item) =>
              `- ${item.quantity}x ${item.product_name}${item.variant ? ` (${item.variant})` : ""} - ${formatCop(item.price * item.quantity)}`,
          )
          .join("\n") +
        "\n"
      : "";

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:20px 24px;background:${brand.accentDark};color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right:10px;">
                            <div style="width:34px;height:34px;border-radius:10px;background:${brand.accent};color:${brand.accentDark};font-weight:800;font-size:16px;line-height:34px;text-align:center;">V</div>
                          </td>
                          <td>
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">Vortixy</div>
                            <div style="font-size:18px;font-weight:700;margin-top:3px;">Actualizaci\u00f3n de pedido</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="font-size:12px;opacity:0.85;">Pedido #${orderShortId}</td>
                  </tr>
                </table>
                <div style="font-size:13px;margin-top:8px;opacity:0.9;">Hola ${firstName}, gracias por comprar en Vortixy.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;">
                <table role="presentation" width="100%" style="margin-bottom:10px;">
                  <tr>
                    <td align="left">${statusPill}</td>
                    <td align="right" style="font-size:12px;color:#6b7280;">ID completo: ${escapeHtml(order.id)}</td>
                  </tr>
                </table>
                ${manualReviewSection}

                <div style="margin-top:14px;border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#f9fafb;">
                  <div style="font-size:12px;color:#6b7280;font-weight:700;margin-bottom:6px;">&#128221; Resumen</div>
                  <table role="presentation" width="100%" style="font-size:13px;color:#111827;">
                    <tr>
                      <td style="padding:4px 0;color:#6b7280;">Estado</td>
                      <td style="padding:4px 0;font-weight:600;text-align:right;">${statusLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;color:#6b7280;">Total</td>
                      <td style="padding:4px 0;font-weight:700;text-align:right;">${formatCop(order.total)}</td>
                    </tr>
                    ${
                      dispatchReference
                        ? `
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;">Referencia de despacho</td>
                        <td style="padding:4px 0;font-weight:600;text-align:right;">${escapeHtml(dispatchReference)}</td>
                      </tr>
                    `
                        : ""
                    }
                    ${
                      trackingCode
                        ? `
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;">Gu\u00eda de seguimiento</td>
                        <td style="padding:4px 0;font-weight:600;text-align:right;">${escapeHtml(trackingCode)}</td>
                      </tr>
                    `
                        : ""
                    }
                  </table>
                </div>

                ${
                  customerNote
                    ? `
                  <div style="margin-top:16px;border-left:4px solid ${brand.accent};background:${brand.accentSoft};padding:12px 14px;border-radius:8px;">
                    <div style="font-size:12px;color:${brand.accentText};font-weight:700;margin-bottom:4px;">&#128172; Mensaje del equipo</div>
                    <div style="font-size:13px;color:#0f172a;">${formatMultiline(customerNote)}</div>
                  </div>
                `
                    : ""
                }

                <div style="margin-top:16px;border:1px dashed #e5e7eb;border-radius:10px;padding:12px;">
                  <div style="font-size:12px;color:#6b7280;font-weight:700;margin-bottom:6px;">&#10145; Pr\u00f3ximo paso</div>
                  <div style="font-size:13px;color:#111827;">${nextStepText}</div>
                </div>

                ${
                  trackingLink
                    ? `
                  <div style="margin-top:18px;text-align:center;">
                    <a href="${trackingLink}" style="display:inline-block;background:${brand.accentStrong};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:700;font-size:13px;">
                      ${trackingCode ? "Ver seguimiento" : "Ver estado del pedido"}
                    </a>
                  </div>
                `
                    : ""
                }

                ${itemsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;">
                <div style="font-size:12px;color:#6b7280;">
                  Si tienes dudas, responde este correo y con gusto te ayudamos.
                </div>
                <div style="margin-top:6px;font-size:11px;color:#9ca3af;">
                  Este es un mensaje autom\u00e1tico sobre tu pedido en Vortixy.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  const text = [
    `Hola ${firstName},`,
    `Actualizaci\u00f3n de tu pedido #${orderShortId}.`,
    `Estado actual: ${statusLabel}`,
    manualReview.completed ? "Revisi\u00f3n manual: completada." : "",
    dispatchReference ? `Referencia de despacho: ${dispatchReference}` : "",
    trackingCode ? `Gu\u00eda de seguimiento: ${trackingCode}` : "",
    customerNote ? `Mensaje del equipo: ${customerNote}` : "",
    itemsText,
    `Total: ${formatCop(order.total)}`,
    `Pr\u00f3ximo paso: ${nextStepText}`,
    trackingLink ? `Ver estado del pedido: ${trackingLink}` : "",
    "Gracias por comprar en Vortixy.",
  ]
    .filter(Boolean)
    .join("\n");

  if (order.customer_email) {
    await sendEmail(order.customer_email, subject, html, text);
  }
}

export async function sendOrderHistoryAccessEmail(input: {
  email: string;
  link: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const safeEmail = String(input.email || "")
    .trim()
    .toLowerCase();
  const safeLink = String(input.link || "").trim();
  if (!safeEmail || !safeLink) return;

  const subject = "Vortixy: Acceso a tu historial de pedidos";
  const escapedLink = escapeHtml(safeLink);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;background:#f3f4f6;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:20px;">
        <h2 style="margin:0 0 10px;font-size:18px;color:#111827;">Acceso seguro a tu historial</h2>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;">
          Recibimos una solicitud para ver el historial de pedidos. Usa el siguiente enlace para acceder:
        </p>
        <p style="margin:0 0 18px;">
          <a href="${escapedLink}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Ver historial de pedidos
          </a>
        </p>
        <p style="margin:0;color:#6b7280;font-size:12px;">
          Si no solicitaste este acceso, puedes ignorar este mensaje.
        </p>
      </div>
    </div>
  `;

  const text = `Acceso seguro a tu historial de pedidos:\n${safeLink}\n\nSi no solicitaste este acceso, ignora este mensaje.`;

  await transporter.sendMail({
    from: emailFrom,
    to: safeEmail,
    subject,
    text,
    html,
  });
}

function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;

  if (!Array.isArray(candidates)) return null;

  const first = candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 4,
  );
  return typeof first === "string" ? first.trim() : null;
}

function extractDispatchReference(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const references = fulfillment.provider_order_references;

  if (!Array.isArray(references)) return null;

  const first = references.find(
    (value) => typeof value === "string" && value.trim().length >= 3,
  );
  return typeof first === "string" ? first.trim() : null;
}

function extractCustomerNote(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const customerUpdates = getRecord(parsed.customer_updates);
  const note = String(customerUpdates.latest_note || "").trim();
  return note || null;
}

function extractManualReview(notes: string | null): {
  completed: boolean;
  completedAt: string | null;
} {
  const parsed = parseNotes(notes);
  const manualReview = getRecord(parsed.manual_review);
  const completed = manualReview.completed === true;
  const completedAt =
    typeof manualReview.completed_at === "string"
      ? manualReview.completed_at
      : null;
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
  text: string,
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
