import { createHmac, timingSafeEqual } from "node:crypto";

const ORDER_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getOrderTokenSecret(): string | null {
  const explicit = process.env.ORDER_LOOKUP_SECRET?.trim();
  return explicit || null;
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

export function isOrderLookupSecretConfigured(): boolean {
  return Boolean(getOrderTokenSecret());
}

export function createOrderLookupToken(orderId: string): string | null {
  const secret = getOrderTokenSecret();
  if (!secret || !orderId) return null;

  const exp = Math.floor(Date.now() / 1000) + ORDER_TOKEN_TTL_SECONDS;
  const payload = `${orderId}.${exp}`;
  const signature = signPayload(secret, payload);

  return `${exp}.${signature}`;
}

export function verifyOrderLookupToken(orderId: string, token: string): boolean {
  const secret = getOrderTokenSecret();
  if (!secret || !orderId || !token) return false;

  const [rawExp, signature] = token.split(".");
  if (!rawExp || !signature) return false;

  const exp = Number(rawExp);
  if (!Number.isFinite(exp)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;

  const payload = `${orderId}.${exp}`;
  const expectedSignature = signPayload(secret, payload);
  return safeCompare(expectedSignature, signature);
}
