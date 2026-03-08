import { createHash } from "crypto";

const IDEMPOTENCY_KEY_MAX_LENGTH = 96;

export function normalizeCheckoutIdempotencyKey(rawValue: string | null | undefined): string | null {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;

  const safe = raw.replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, IDEMPOTENCY_KEY_MAX_LENGTH);
  if (safe.length < 12) return null;
  return safe;
}

export function toCheckoutPaymentId(idempotencyKey: string | null): string | null {
  if (!idempotencyKey) return null;
  return `manual_cod:${idempotencyKey}`;
}

export function hashCheckoutPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function isDuplicateOrderPaymentIdError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  const code = String(maybeError.code || "").trim();
  if (code === "23505") {
    const message = String(maybeError.message || "").toLowerCase();
    return message.includes("idx_orders_payment_unique") || message.includes("payment_id");
  }
  return false;
}
