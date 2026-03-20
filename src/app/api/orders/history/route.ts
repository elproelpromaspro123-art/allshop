import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { createOrderLookupToken } from "@/lib/order-token";
import { getPhoneLookupCandidates, normalizePhone } from "@/lib/phone";
import {
  createOrderHistoryToken,
  isOrderHistorySecretConfigured,
  verifyOrderHistoryToken,
} from "@/lib/order-history-token";
import {
  isEmailConfigured,
  sendOrderHistoryAccessEmail,
} from "@/lib/notifications";
import { getBaseUrl } from "@/lib/site";
import type { OrderStatus } from "@/types/database";

export const maxBodySize = 5 * 1024;

interface HistoryBody {
  email?: string;
  phone?: string;
  document?: string;
  token?: string;
}

interface HistoryRow {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  customer_document: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeDigits(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

function documentMatches(
  orderDocument: string,
  providedDocument: string,
): boolean {
  const orderDigits = normalizeDigits(orderDocument);
  if (!orderDigits || !providedDocument) return false;
  return orderDigits === providedDocument;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    console.warn(`[OrderHistory] Large body rejected for IP: ${clientIp}`);
    return NextResponse.json(
      { error: "Solicitud demasiado grande." },
      { status: 413 },
    );
  }

  const rateLimit = await checkRateLimitDb({
    key: `order-history:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[OrderHistory] Rate limit hit for IP: ${clientIp}`);
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Base de datos no configurada para historial de pedidos." },
      { status: 500 },
    );
  }

  let body: HistoryBody;
  try {
    body = (await request.json()) as HistoryBody;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida para consultar historial." },
      { status: 400 },
    );
  }

  const rawToken = String(body.token || "").trim();
  const tokenFlow = rawToken.length > 0;

  let email = "";
  let normalizedPhone = "";
  let phoneCandidates: string[] = [];
  let documentDigits = "";

  if (tokenFlow) {
    const payload = verifyOrderHistoryToken(rawToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Token de acceso inválido." },
        { status: 401 },
      );
    }
    email = String(payload.email || "")
      .trim()
      .toLowerCase();
    normalizedPhone = normalizePhone(String(payload.phone || "").trim()) || "";
    phoneCandidates = getPhoneLookupCandidates(normalizedPhone);
    documentDigits = normalizeDigits(String(payload.document || "").trim());
  } else {
    email = String(body.email || "")
      .trim()
      .toLowerCase();
    normalizedPhone = normalizePhone(String(body.phone || "").trim()) || "";
    phoneCandidates = getPhoneLookupCandidates(String(body.phone || "").trim());
    documentDigits = normalizeDigits(String(body.document || "").trim());

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }

    if (!normalizedPhone || !phoneCandidates.length) {
      return NextResponse.json(
        { error: "Teléfono inválido." },
        { status: 400 },
      );
    }

    if (documentDigits.length < 6) {
      return NextResponse.json(
        { error: "El documento debe tener al menos 6 dígitos para validar." },
        { status: 400 },
      );
    }

    if (
      process.env.NODE_ENV === "production" &&
      !isOrderHistorySecretConfigured()
    ) {
      return NextResponse.json(
        {
          error:
            "Configura ORDER_HISTORY_SECRET para habilitar el historial seguro.",
        },
        { status: 500 },
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Configura SMTP para enviar el acceso seguro al historial." },
        { status: 500 },
      );
    }

    const identityRateLimit = await checkRateLimitDb({
      key: `order-history:${clientIp}:${email}:${normalizedPhone}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!identityRateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(identityRateLimit.retryAfterSeconds),
          },
        },
      );
    }
  }

  if (
    !email ||
    !normalizedPhone ||
    !phoneCandidates.length ||
    documentDigits.length < 6
  ) {
    return NextResponse.json(
      { error: "Datos inválidos para consultar historial." },
      { status: 400 },
    );
  }

  let query = supabaseAdmin
    .from("orders")
    .select("id,status,total,created_at,updated_at,customer_document")
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(30);

  query =
    phoneCandidates.length === 1
      ? query.eq("customer_phone", phoneCandidates[0])
      : query.in("customer_phone", phoneCandidates);

  const { data, error } = await query;
  if (error) {
    console.error("[OrderHistory] Query error:", error);
    return NextResponse.json(
      { error: "No se pudo consultar el historial en este momento." },
      { status: 500 },
    );
  }

  const rows = ((data || []) as HistoryRow[]).filter((row) =>
    documentMatches(row.customer_document, documentDigits),
  );

  if (tokenFlow) {
    const orders = rows
      .map((row) => ({
        id: row.id,
        status: row.status,
        total: row.total,
        created_at: row.created_at,
        updated_at: row.updated_at,
        order_token: createOrderLookupToken(row.id),
      }))
      .filter(
        (row) =>
          typeof row.order_token === "string" && row.order_token.length > 0,
      );

    return NextResponse.json({
      ok: true,
      orders,
    });
  }

  if (rows.length > 0) {
    const historyToken = createOrderHistoryToken({
      email,
      phone: normalizedPhone,
      document: documentDigits,
    });

    if (!historyToken) {
      return NextResponse.json(
        { error: "No se pudo generar el acceso seguro al historial." },
        { status: 500 },
      );
    }

    const accessUrl = `${getBaseUrl()}/seguimiento?history_token=${encodeURIComponent(historyToken)}`;
    try {
      await sendOrderHistoryAccessEmail({ email, link: accessUrl });
    } catch (sendError) {
      console.error("[OrderHistory] Email send error:", sendError);
      return NextResponse.json(
        {
          error: "No se pudo enviar el acceso al historial. Intenta más tarde.",
        },
        { status: 500 },
      );
    }
  }

  // SECURITY: Anti-timing attack - always wait minimum consistent time
  const elapsed = Date.now() - startTime;
  if (elapsed < 500) {
    await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
  }

  return NextResponse.json({
    ok: true,
    action: "verify_email",
  });
}
