import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const DEFAULT_TTL_MINUTES = 15;
const MIN_TTL_MINUTES = 5;
const MAX_TTL_MINUTES = 60;

interface OrderHistoryTokenPayload {
  email: string;
  phone: string;
  document: string;
  exp: number;
  nonce: string;
}

function getOrderHistorySecret(): string | null {
  const explicit = String(process.env.ORDER_HISTORY_SECRET || "").trim();
  if (explicit) return explicit;
  const fallback = String(process.env.ORDER_LOOKUP_SECRET || "").trim();
  return fallback || null;
}

function getTtlSeconds(): number {
  const raw = Number(process.env.ORDER_HISTORY_TOKEN_TTL_MINUTES);
  const minutes = Number.isFinite(raw)
    ? Math.min(MAX_TTL_MINUTES, Math.max(MIN_TTL_MINUTES, Math.floor(raw)))
    : DEFAULT_TTL_MINUTES;
  return minutes * 60;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signPayload(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function isOrderHistorySecretConfigured(): boolean {
  return Boolean(getOrderHistorySecret());
}

export function createOrderHistoryToken(input: {
  email: string;
  phone: string;
  document: string;
}): string | null {
  const secret = getOrderHistorySecret();
  if (!secret) return null;

  const payload: OrderHistoryTokenPayload = {
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    document: input.document.trim(),
    exp: Math.floor(Date.now() / 1000) + getTtlSeconds(),
    nonce: randomBytes(16).toString("hex"),
  };

  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(secret, encoded);
  return `${encoded}.${signature}`;
}

export function verifyOrderHistoryToken(
  token: string,
): OrderHistoryTokenPayload | null {
  const secret = getOrderHistorySecret();
  if (!secret || !token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(secret, encoded);
  if (!safeCompare(expected, signature)) return null;

  try {
    const decoded = JSON.parse(
      base64UrlDecode(encoded),
    ) as OrderHistoryTokenPayload;
    if (!decoded || typeof decoded !== "object") return null;
    if (!decoded.email || !decoded.phone || !decoded.document || !decoded.exp)
      return null;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}
