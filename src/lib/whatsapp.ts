import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_WHATSAPP_API_BASE_URL = "https://graph.facebook.com/v22.0";

const WHATSAPP_ACCESS_TOKEN = String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
const WHATSAPP_PHONE_NUMBER_ID = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
const WHATSAPP_VERIFY_TOKEN = String(process.env.WHATSAPP_VERIFY_TOKEN || "").trim();
const WHATSAPP_APP_SECRET = String(process.env.WHATSAPP_APP_SECRET || "").trim();
const WHATSAPP_API_BASE_URL = String(
  process.env.WHATSAPP_API_BASE_URL || DEFAULT_WHATSAPP_API_BASE_URL
).trim();

export type WhatsAppConfirmationStage =
  | "pending_first"
  | "pending_second"
  | "confirmed"
  | "cancelled"
  | "failed_to_send";

export interface WhatsAppOrderItemSummary {
  name: string;
  quantity: number;
  variant?: string | null;
}

export interface BuildWhatsAppFirstConfirmationInput {
  customerName: string;
  orderId: string;
  items: WhatsAppOrderItemSummary[];
  total: number;
  etaRange: string;
}

interface WhatsAppApiMessagesPayload {
  messages?: Array<{ id?: string }>;
  error?: {
    message?: string;
    error_user_msg?: string;
  };
}

export interface WhatsAppTextSendResult {
  messageId: string | null;
  raw: Record<string, unknown>;
}

export function isWhatsAppMessagingConfigured(): boolean {
  return Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
}

export function isWhatsAppWebhookConfigured(): boolean {
  return Boolean(WHATSAPP_VERIFY_TOKEN);
}

export function getWhatsAppVerifyToken(): string | null {
  return WHATSAPP_VERIFY_TOKEN || null;
}

export function normalizeWhatsAppPhone(value: string): string | null {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return null;

  if (digits.length === 12 && digits.startsWith("57")) {
    return digits;
  }

  if (digits.length === 10 && digits.startsWith("3")) {
    return `57${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("03")) {
    return `57${digits.slice(1)}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function getWhatsAppPhoneLookupCandidates(value: string): string[] {
  const normalized = normalizeWhatsAppPhone(value);
  if (!normalized) return [];

  const candidates = new Set<string>([normalized]);
  if (normalized.startsWith("57") && normalized.length === 12) {
    candidates.add(normalized.slice(2));
  }
  return Array.from(candidates);
}

export async function sendWhatsAppTextMessage(input: {
  to: string;
  body: string;
}): Promise<WhatsAppTextSendResult> {
  if (!isWhatsAppMessagingConfigured()) {
    throw new Error(
      "WhatsApp is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  const to = normalizeWhatsAppPhone(input.to);
  if (!to) {
    throw new Error("Invalid phone number for WhatsApp notification.");
  }

  const response = await fetch(`${WHATSAPP_API_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: String(input.body || "").trim(),
      },
    }),
  });

  const payload = await parseJsonRecord(response);
  if (!response.ok) {
    const parsedPayload = payload as WhatsAppApiMessagesPayload;
    const apiError =
      parsedPayload.error?.error_user_msg ||
      parsedPayload.error?.message ||
      `${response.status} ${response.statusText}`;
    throw new Error(`WhatsApp API error: ${apiError}`);
  }

  const parsedPayload = payload as WhatsAppApiMessagesPayload;
  const firstMessage = Array.isArray(parsedPayload.messages)
    ? parsedPayload.messages[0]
    : null;
  const messageId =
    firstMessage && typeof firstMessage.id === "string" ? firstMessage.id : null;

  return {
    messageId,
    raw: payload,
  };
}

export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!WHATSAPP_APP_SECRET) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac("sha256", WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest("hex")}`;

  if (expectedSignature.length !== signatureHeader.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(signatureHeader, "utf8"),
    Buffer.from(expectedSignature, "utf8")
  );
}

export function buildWhatsAppFirstConfirmationMessage(
  input: BuildWhatsAppFirstConfirmationInput
): string {
  const firstName = String(input.customerName || "cliente").trim().split(" ")[0] || "cliente";
  const shortReference = shortOrderReference(input.orderId);
  const itemsSummary = formatItemsSummary(input.items);

  return [
    `Hola ${firstName}, gracias por comprar en Vortixy.`,
    `Pedido #${shortReference}`,
    `Producto: ${itemsSummary}`,
    `Total contra entrega: ${formatCop(input.total)}`,
    `Entrega estimada: ${normalizeEtaRange(input.etaRange)}`,
    "",
    "Para confirmar tu pedido responde: SI",
    "Si no deseas continuar responde: NO",
  ].join("\n");
}

export function buildWhatsAppSecondConfirmationMessage(orderId: string): string {
  return [
    `Pedido #${shortOrderReference(orderId)}`,
    "Ultima verificacion:",
    "Estas seguro de recibir este pedido en la direccion registrada?",
    "",
    "Responde SI para confirmar despacho",
    "Responde NO para cancelar el pedido",
  ].join("\n");
}

export function buildWhatsAppConfirmedMessage(input: {
  orderId: string;
  etaRange: string;
}): string {
  return [
    `Pedido #${shortOrderReference(input.orderId)} confirmado.`,
    "Tu despacho ya fue enviado a preparacion.",
    `Entrega estimada: ${normalizeEtaRange(input.etaRange)}.`,
    "Te avisaremos por correo cuando tengamos guia.",
  ].join("\n");
}

export function buildWhatsAppTrackingMessage(input: {
  orderId: string;
  trackingCode: string;
  statusLabel?: string;
}): string {
  const tracking = String(input.trackingCode || "").trim();
  const status = String(input.statusLabel || "").trim();
  const shortReference = shortOrderReference(input.orderId);

  return [
    `Actualizacion de tu pedido #${shortReference}.`,
    status ? `Estado actual: ${status}.` : "Estado actual: En proceso de envio.",
    `Guia de seguimiento: ${tracking}.`,
    "Te enviaremos mas novedades por este medio y por correo.",
  ].join("\n");
}

export function buildWhatsAppCancelledMessage(orderId: string): string {
  return [
    `Pedido #${shortOrderReference(orderId)} cancelado.`,
    "No se genero despacho.",
    "Si deseas comprar de nuevo, puedes hacerlo desde la tienda.",
  ].join("\n");
}

export function buildWhatsAppNoOrderMessage(): string {
  return [
    "No encontramos un pedido pendiente de confirmacion con este numero.",
    "Si ya confirmaste, te avisaremos por correo en la siguiente actualizacion.",
    "Si necesitas ayuda, escribe a soporte.",
  ].join("\n");
}

export function buildWhatsAppUnknownReplyMessage(
  stage: "pending_first" | "pending_second"
): string {
  if (stage === "pending_second") {
    return [
      "No logre identificar tu respuesta.",
      "Para confirmar despacho responde: SI",
      "Para cancelar el pedido responde: NO",
    ].join("\n");
  }

  return [
    "No logre identificar tu respuesta.",
    "Para continuar con tu pedido responde: SI",
    "Si deseas cancelarlo responde: NO",
  ].join("\n");
}

function shortOrderReference(orderId: string): string {
  const value = String(orderId || "").trim();
  if (!value) return "N/A";
  return value.slice(0, 8).toUpperCase();
}

function normalizeEtaRange(value: string): string {
  const clean = String(value || "").trim();
  if (!clean) return "2 a 7 dias habiles";
  return clean;
}

function formatItemsSummary(items: WhatsAppOrderItemSummary[]): string {
  const normalized = items
    .map((item) => {
      const name = String(item.name || "").trim();
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const variant = String(item.variant || "").trim();
      const variantText = variant ? ` (${variant})` : "";
      return `${name}${variantText} x${quantity}`;
    })
    .filter((value) => value.length > 0);

  if (!normalized.length) {
    return "Producto seleccionado";
  }

  const summary = normalized.join(", ");
  return summary.length > 220 ? `${summary.slice(0, 217)}...` : summary;
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));
}

async function parseJsonRecord(response: Response): Promise<Record<string, unknown>> {
  try {
    const parsed = (await response.json()) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return {};
  }
}
