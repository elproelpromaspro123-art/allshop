import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { createOrderLookupToken } from "@/lib/order-token";
import { getPhoneLookupCandidates, normalizePhone } from "@/lib/phone";
import type { OrderStatus } from "@/types/database";

interface HistoryBody {
  email?: string;
  phone?: string;
  document?: string;
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

function documentMatches(orderDocument: string, providedDocument: string): boolean {
  const orderDigits = normalizeDigits(orderDocument);
  if (!orderDigits || !providedDocument) return false;

  if (providedDocument.length >= 6) {
    return orderDigits === providedDocument;
  }

  return orderDigits.endsWith(providedDocument);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `order-history:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Base de datos no configurada para historial de pedidos." },
      { status: 500 }
    );
  }

  let body: HistoryBody;
  try {
    body = (await request.json()) as HistoryBody;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida para consultar historial." },
      { status: 400 }
    );
  }

  const email = String(body.email || "").trim().toLowerCase();
  const normalizedPhone = normalizePhone(String(body.phone || "").trim());
  const phoneCandidates = getPhoneLookupCandidates(String(body.phone || "").trim());
  const documentDigits = normalizeDigits(String(body.document || "").trim());

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Correo inválido." },
      { status: 400 }
    );
  }

  if (!normalizedPhone || !phoneCandidates.length) {
    return NextResponse.json(
      { error: "Teléfono inválido." },
      { status: 400 }
    );
  }

  if (documentDigits && documentDigits.length < 4) {
    return NextResponse.json(
      { error: "El documento debe tener al menos 4 dígitos para validar." },
      { status: 400 }
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
      { status: 500 }
    );
  }

  const rows = ((data || []) as HistoryRow[]).filter((row) =>
    documentDigits ? documentMatches(row.customer_document, documentDigits) : true
  );

  const orders = rows
    .map((row) => ({
      id: row.id,
      status: row.status,
      total: row.total,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order_token: createOrderLookupToken(row.id),
    }))
    .filter((row) => typeof row.order_token === "string" && row.order_token.length > 0);

  return NextResponse.json({
    ok: true,
    orders,
  });
}
