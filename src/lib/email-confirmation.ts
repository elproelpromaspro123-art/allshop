import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const DEFAULT_EMAIL_CONFIRMATION_TTL_MINUTES = 30;
const MIN_EMAIL_CONFIRMATION_TTL_MINUTES = 5;
const MAX_EMAIL_CONFIRMATION_TTL_MINUTES = 120;

function resolveEmailConfirmationTtlMinutes(): number {
  const raw = Number(process.env.EMAIL_CONFIRMATION_TTL_MINUTES);
  if (!Number.isFinite(raw)) {
    return DEFAULT_EMAIL_CONFIRMATION_TTL_MINUTES;
  }

  const rounded = Math.floor(raw);
  return Math.min(
    MAX_EMAIL_CONFIRMATION_TTL_MINUTES,
    Math.max(MIN_EMAIL_CONFIRMATION_TTL_MINUTES, rounded)
  );
}

export const EMAIL_CONFIRMATION_TTL_MINUTES = resolveEmailConfirmationTtlMinutes();
export const EMAIL_CONFIRMATION_CODE_LENGTH = 6;
export const EMAIL_CONFIRMATION_MAX_ATTEMPTS = 5;

export type EmailConfirmationStage =
  | "pending"
  | "confirmed"
  | "failed_to_send"
  | "blocked";

export interface EmailConfirmationState {
  required: boolean;
  stage: EmailConfirmationStage;
  code_hash: string;
  code_expires_at: string;
  code_sent_at: string;
  sent_to: string;
  confirmation_attempts: number;
  max_attempts: number;
  confirmed_at?: string;
  last_attempt_at?: string;
  failed_at?: string;
  blocked_at?: string;
  last_error?: string;
}

export interface EmailConfirmationSnapshot {
  required: boolean;
  stage: EmailConfirmationStage;
  codeHash: string;
  codeExpiresAt: string | null;
  codeSentAt: string | null;
  sentTo: string | null;
  confirmationAttempts: number;
  maxAttempts: number;
  confirmedAt: string | null;
}

interface BuildPendingConfirmationInput {
  orderId: string;
  email: string;
  now?: Date;
}

interface BuildPendingConfirmationResult {
  code: string;
  state: EmailConfirmationState;
}

function getEmailConfirmationSecret(): string {
  const explicit = process.env.ORDER_LOOKUP_SECRET?.trim();
  if (explicit) return explicit;
  return "email-confirmation-dev-secret";
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
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

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function clampNonNegativeInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return fallback;
  return Math.floor(numberValue);
}

export function normalizeEmailConfirmationCode(input: string): string | null {
  const normalized = String(input || "").replace(/\D+/g, "");
  if (normalized.length !== EMAIL_CONFIRMATION_CODE_LENGTH) return null;
  return normalized;
}

export function generateEmailConfirmationCode(): string {
  const max = 10 ** EMAIL_CONFIRMATION_CODE_LENGTH;
  const value = randomInt(0, max);
  return String(value).padStart(EMAIL_CONFIRMATION_CODE_LENGTH, "0");
}

export function hashEmailConfirmationCode(orderId: string, code: string): string {
  const normalizedCode = normalizeEmailConfirmationCode(code);
  if (!normalizedCode) return "";

  const payload = `${orderId}.${normalizedCode}`;
  return createHmac("sha256", getEmailConfirmationSecret()).update(payload).digest("hex");
}

export function buildPendingEmailConfirmation(
  input: BuildPendingConfirmationInput
): BuildPendingConfirmationResult {
  const code = generateEmailConfirmationCode();
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + EMAIL_CONFIRMATION_TTL_MINUTES * 60 * 1000);

  return {
    code,
    state: {
      required: true,
      stage: "pending",
      code_hash: hashEmailConfirmationCode(input.orderId, code),
      code_expires_at: expiresAt.toISOString(),
      code_sent_at: now.toISOString(),
      sent_to: String(input.email || "").trim().toLowerCase(),
      confirmation_attempts: 0,
      max_attempts: EMAIL_CONFIRMATION_MAX_ATTEMPTS,
    },
  };
}

export function isEmailConfirmationCodeMatch(input: {
  orderId: string;
  code: string;
  expectedHash: string;
}): boolean {
  const normalizedCode = normalizeEmailConfirmationCode(input.code);
  if (!normalizedCode) return false;

  const recalculated = hashEmailConfirmationCode(input.orderId, normalizedCode);
  if (!recalculated || !input.expectedHash) return false;
  return safeCompare(recalculated, input.expectedHash);
}

export function extractEmailConfirmationSnapshot(
  rawNotes: string | null
): EmailConfirmationSnapshot {
  const notes = parseNotes(rawNotes);
  const confirmation = getRecord(notes.email_confirmation);
  const normalizedStage = String(confirmation.stage || "").trim().toLowerCase();
  const stage: EmailConfirmationStage =
    normalizedStage === "confirmed"
      ? "confirmed"
      : normalizedStage === "failed_to_send"
        ? "failed_to_send"
        : normalizedStage === "blocked"
          ? "blocked"
          : "pending";

  return {
    required: confirmation.required !== false,
    stage,
    codeHash: String(confirmation.code_hash || "").trim(),
    codeExpiresAt: toIsoDate(confirmation.code_expires_at),
    codeSentAt: toIsoDate(confirmation.code_sent_at),
    sentTo:
      typeof confirmation.sent_to === "string" && confirmation.sent_to.trim()
        ? confirmation.sent_to.trim()
        : null,
    confirmationAttempts: clampNonNegativeInteger(confirmation.confirmation_attempts, 0),
    maxAttempts: Math.max(
      1,
      clampNonNegativeInteger(confirmation.max_attempts, EMAIL_CONFIRMATION_MAX_ATTEMPTS)
    ),
    confirmedAt: toIsoDate(confirmation.confirmed_at),
  };
}

export function isEmailConfirmationExpired(snapshot: EmailConfirmationSnapshot): boolean {
  if (!snapshot.codeExpiresAt) return true;
  return Date.parse(snapshot.codeExpiresAt) < Date.now();
}

export function patchEmailConfirmationNotes(
  previousNotes: string | null,
  patch: Record<string, unknown> | EmailConfirmationState
): string {
  const notes = parseNotes(previousNotes);
  const current = getRecord(notes.email_confirmation);

  notes.email_confirmation = {
    ...current,
    ...patch,
    required: true,
  };

  return JSON.stringify(notes);
}
