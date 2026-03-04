import { NextRequest, NextResponse } from "next/server";
import { processFulfillment } from "@/lib/fulfillment";
import { notifyOrderStatus } from "@/lib/notifications";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import {
  buildWhatsAppCancelledMessage,
  buildWhatsAppConfirmedMessage,
  buildWhatsAppNoOrderMessage,
  buildWhatsAppSecondConfirmationMessage,
  buildWhatsAppUnknownReplyMessage,
  getWhatsAppPhoneLookupCandidates,
  getWhatsAppVerifyToken,
  isWhatsAppMessagingConfigured,
  isWhatsAppWebhookConfigured,
  normalizeWhatsAppPhone,
  sendWhatsAppTextMessage,
  verifyWhatsAppWebhookSignature,
  type WhatsAppConfirmationStage,
} from "@/lib/whatsapp";
import type { OrderStatus } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WhatsAppWebhookMessage {
  id?: string;
  from?: string;
  text?: {
    body?: string;
  };
  button?: {
    text?: string;
  };
  interactive?: {
    button_reply?: {
      title?: string;
    };
    list_reply?: {
      title?: string;
    };
  };
}

interface WhatsAppWebhookValue {
  messages?: WhatsAppWebhookMessage[];
}

interface WhatsAppWebhookChange {
  value?: WhatsAppWebhookValue;
}

interface WhatsAppWebhookEntry {
  changes?: WhatsAppWebhookChange[];
}

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

interface OrderCandidate {
  id: string;
  status: OrderStatus;
  customer_phone: string;
  customer_name: string;
  total: number;
  notes: string | null;
  created_at: string;
}

type ReplyIntent = "confirm" | "cancel" | "unknown";

interface WhatsAppConfirmationSnapshot {
  stage: WhatsAppConfirmationStage;
  confirmationsRequired: number;
  confirmationsReceived: number;
  etaRange: string;
}

const ACTIVE_PENDING_STAGES = new Set<WhatsAppConfirmationStage>([
  "pending_first",
  "pending_second",
]);

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge") || "";

  const verifyToken = getWhatsAppVerifyToken();

  if (!isWhatsAppWebhookConfigured() || !verifyToken) {
    return NextResponse.json(
      { error: "Webhook de WhatsApp no configurado." },
      { status: 500 }
    );
  }

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Token de verificacion invalido." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Firma invalida." }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured || !isWhatsAppMessagingConfigured()) {
    return NextResponse.json({ ok: true });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true });
  }

  const messages = collectInboundMessages(payload);
  for (const message of messages) {
    try {
      await processInboundMessage(message);
    } catch (error) {
      console.error("[WhatsApp Webhook] Error processing inbound message:", error);
    }
  }

  return NextResponse.json({ ok: true });
}

function collectInboundMessages(payload: WhatsAppWebhookPayload): WhatsAppWebhookMessage[] {
  const inboundMessages: WhatsAppWebhookMessage[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages;
      if (!Array.isArray(messages)) continue;

      for (const message of messages) {
        inboundMessages.push(message);
      }
    }
  }

  return inboundMessages;
}

async function processInboundMessage(message: WhatsAppWebhookMessage): Promise<void> {
  const senderPhone = normalizeWhatsAppPhone(String(message.from || ""));
  if (!senderPhone) return;

  const order = await findLatestOrderForPhone(senderPhone);
  if (!order) {
    await safeSendWhatsAppMessage(senderPhone, buildWhatsAppNoOrderMessage());
    return;
  }

  const inboundText = extractInboundText(message);
  const intent = parseReplyIntent(inboundText);
  const snapshot = extractConfirmationSnapshot(order.notes);
  const now = new Date().toISOString();

  if (snapshot.stage === "confirmed") {
    await safeSendWhatsAppMessage(
      senderPhone,
      buildWhatsAppConfirmedMessage({ orderId: order.id, etaRange: snapshot.etaRange })
    );
    return;
  }

  if (snapshot.stage === "cancelled") {
    await safeSendWhatsAppMessage(senderPhone, buildWhatsAppCancelledMessage(order.id));
    return;
  }

  if (snapshot.stage === "pending_first") {
    if (intent === "confirm") {
      const updated = await updateOrderNotesState({
        order,
        patch: {
          stage: "pending_second",
          confirmations_required: Math.max(2, snapshot.confirmationsRequired),
          confirmations_received: Math.max(1, snapshot.confirmationsReceived),
          first_confirmed_at: now,
          last_customer_reply: sanitizeReplyForLog(inboundText),
          last_customer_reply_at: now,
          last_inbound_message_id: message.id || null,
          last_prompt_at: now,
        },
      });

      if (!updated) return;

      await safeSendWhatsAppMessage(
        senderPhone,
        buildWhatsAppSecondConfirmationMessage(order.id)
      );
      return;
    }

    if (intent === "cancel") {
      await cancelOrderByWhatsApp({
        order,
        inboundText,
        messageId: message.id || null,
      });
      await safeSendWhatsAppMessage(senderPhone, buildWhatsAppCancelledMessage(order.id));
      return;
    }

    await safeSendWhatsAppMessage(
      senderPhone,
      buildWhatsAppUnknownReplyMessage("pending_first")
    );
    return;
  }

  if (snapshot.stage === "pending_second") {
    if (intent === "confirm") {
      const confirmedOrder = await updateOrderNotesState({
        order,
        patch: {
          stage: "confirmed",
          confirmations_required: Math.max(2, snapshot.confirmationsRequired),
          confirmations_received: Math.max(2, snapshot.confirmationsReceived),
          confirmed_at: now,
          last_customer_reply: sanitizeReplyForLog(inboundText),
          last_customer_reply_at: now,
          last_inbound_message_id: message.id || null,
        },
      });

      if (!confirmedOrder) return;

      let finalStatus: OrderStatus = confirmedOrder.status;

      try {
        await processFulfillment(order.id);
      } catch (error) {
        console.error("[WhatsApp Webhook] Fulfillment error:", error);
      }

      const { data: refreshedOrder } = await supabaseAdmin
        .from("orders")
        .select("status,notes")
        .eq("id", order.id)
        .maybeSingle();

      if (refreshedOrder?.status) {
        finalStatus = refreshedOrder.status as OrderStatus;
      }

      try {
        await notifyOrderStatus(order.id, finalStatus);
      } catch (error) {
        console.error("[WhatsApp Webhook] Notification error:", error);
      }

      const etaRange = extractConfirmationSnapshot(
        (refreshedOrder?.notes as string | null | undefined) ?? confirmedOrder.notes
      ).etaRange;

      await safeSendWhatsAppMessage(
        senderPhone,
        buildWhatsAppConfirmedMessage({ orderId: order.id, etaRange })
      );
      return;
    }

    if (intent === "cancel") {
      await cancelOrderByWhatsApp({
        order,
        inboundText,
        messageId: message.id || null,
      });
      await safeSendWhatsAppMessage(senderPhone, buildWhatsAppCancelledMessage(order.id));
      return;
    }

    await safeSendWhatsAppMessage(
      senderPhone,
      buildWhatsAppUnknownReplyMessage("pending_second")
    );
    return;
  }

  await safeSendWhatsAppMessage(senderPhone, buildWhatsAppNoOrderMessage());
}

async function findLatestOrderForPhone(phone: string): Promise<OrderCandidate | null> {
  const candidates = getWhatsAppPhoneLookupCandidates(phone);
  if (!candidates.length) return null;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id,status,customer_phone,customer_name,total,notes,created_at")
    .in("customer_phone", candidates)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data?.length) {
    if (error) {
      console.error("[WhatsApp Webhook] Error loading orders:", error);
    }
    return null;
  }

  const rows = data as OrderCandidate[];

  const pendingOrder = rows.find((order) => {
    const snapshot = extractConfirmationSnapshot(order.notes);
    return ACTIVE_PENDING_STAGES.has(snapshot.stage);
  });

  if (pendingOrder) return pendingOrder;

  const trackedOrder = rows.find((order) => {
    const snapshot = extractConfirmationSnapshot(order.notes);
    return snapshot.stage === "confirmed" || snapshot.stage === "cancelled";
  });

  return trackedOrder || null;
}

async function cancelOrderByWhatsApp(input: {
  order: OrderCandidate;
  inboundText: string;
  messageId: string | null;
}): Promise<void> {
  const now = new Date().toISOString();

  const updatedOrder = await updateOrderNotesState({
    order: input.order,
    status: "cancelled",
    patch: {
      stage: "cancelled",
      cancelled_at: now,
      last_customer_reply: sanitizeReplyForLog(input.inboundText),
      last_customer_reply_at: now,
      last_inbound_message_id: input.messageId,
    },
  });

  if (!updatedOrder) return;

  try {
    await notifyOrderStatus(input.order.id, "cancelled");
  } catch (error) {
    console.error("[WhatsApp Webhook] Notification error (cancelled):", error);
  }
}

async function updateOrderNotesState(input: {
  order: OrderCandidate;
  patch: Record<string, unknown>;
  status?: OrderStatus;
}): Promise<OrderCandidate | null> {
  const nextNotes = patchWhatsAppConfirmation(input.order.notes, input.patch);

  let query = supabaseAdmin
    .from("orders")
    .update({
      notes: nextNotes,
      ...(input.status ? { status: input.status } : {}),
    })
    .eq("id", input.order.id);

  if (input.order.notes === null) {
    query = query.is("notes", null);
  } else {
    query = query.eq("notes", input.order.notes);
  }

  const { data, error } = await query
    .select("id,status,customer_phone,customer_name,total,notes,created_at")
    .maybeSingle();

  if (error) {
    console.error("[WhatsApp Webhook] Error updating order notes:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as OrderCandidate;
}

async function safeSendWhatsAppMessage(to: string, body: string): Promise<void> {
  try {
    await sendWhatsAppTextMessage({ to, body });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error sending WhatsApp response:", error);
  }
}

function patchWhatsAppConfirmation(
  rawNotes: string | null,
  patch: Record<string, unknown>
): string {
  const notes = parseNotes(rawNotes);
  const currentConfirmation = getRecord(notes.whatsapp_confirmation);

  notes.whatsapp_confirmation = {
    ...currentConfirmation,
    required: true,
    ...patch,
  };

  return JSON.stringify(notes);
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

function extractConfirmationSnapshot(rawNotes: string | null): WhatsAppConfirmationSnapshot {
  const notes = parseNotes(rawNotes);
  const confirmation = getRecord(notes.whatsapp_confirmation);
  const logistics = getRecord(notes.logistics);

  const stage = normalizeStage(String(confirmation.stage || ""));
  const confirmationsRequired = Number(confirmation.confirmations_required);
  const confirmationsReceived = Number(confirmation.confirmations_received);
  const etaRange = String(logistics.estimated_range || "").trim() || "2 a 7 dias habiles";

  return {
    stage,
    confirmationsRequired:
      Number.isFinite(confirmationsRequired) && confirmationsRequired > 0
        ? Math.floor(confirmationsRequired)
        : 2,
    confirmationsReceived:
      Number.isFinite(confirmationsReceived) && confirmationsReceived >= 0
        ? Math.floor(confirmationsReceived)
        : 0,
    etaRange,
  };
}

function normalizeStage(value: string): WhatsAppConfirmationStage {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pending_second") return "pending_second";
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "failed_to_send") return "failed_to_send";
  return "pending_first";
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function extractInboundText(message: WhatsAppWebhookMessage): string {
  if (typeof message.text?.body === "string" && message.text.body.trim()) {
    return message.text.body.trim();
  }

  if (typeof message.button?.text === "string" && message.button.text.trim()) {
    return message.button.text.trim();
  }

  if (
    typeof message.interactive?.button_reply?.title === "string" &&
    message.interactive.button_reply.title.trim()
  ) {
    return message.interactive.button_reply.title.trim();
  }

  if (
    typeof message.interactive?.list_reply?.title === "string" &&
    message.interactive.list_reply.title.trim()
  ) {
    return message.interactive.list_reply.title.trim();
  }

  return "";
}

function parseReplyIntent(input: string): ReplyIntent {
  const normalized = normalizeReply(input);
  if (!normalized) return "unknown";

  if (
    /\bno\b/.test(normalized) ||
    /\bcancel(ar|o|ado)?\b/.test(normalized) ||
    /\banular\b/.test(normalized)
  ) {
    return "cancel";
  }

  if (
    normalized === "ok" ||
    /\bsi\b/.test(normalized) ||
    /\bconfirmo\b/.test(normalized)
  ) {
    return "confirm";
  }

  return "unknown";
}

function normalizeReply(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function sanitizeReplyForLog(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
