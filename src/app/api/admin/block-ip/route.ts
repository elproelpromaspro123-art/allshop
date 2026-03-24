import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { blockIp, unblockIp } from "@/lib/ip-block";
import { sendBlockNotificationToDiscord } from "@/lib/discord";
import {
  isAdminActionSecretConfigured,
  isAdminActionSecretValid,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { isValidIpAddress, getClientIp } from "@/lib/utils";

type BlockDuration = "permanent" | "24h" | "1h";

interface BlockBody {
  ip?: string;
  duration?: BlockDuration;
  action?: "block" | "unblock";
}

function sanitizeIp(value: unknown): string {
  return String(value || "").trim();
}

function isValidDuration(value: unknown): value is BlockDuration {
  return value === "permanent" || value === "24h" || value === "1h";
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `admin-block:${clientIp}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return apiError("Demasiadas solicitudes. Intenta más tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  if (!isAdminActionSecretConfigured()) {
    return apiError(
      "Configura ADMIN_BLOCK_SECRET (o ORDER_LOOKUP_SECRET) para habilitar este endpoint.",
      { status: 500, code: "CONFIG_MISSING", headers: noStoreHeaders() },
    );
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!isAdminActionSecretValid(token)) {
    return apiError("No autorizado.", {
      status: 401,
      code: "UNAUTHORIZED",
      headers: noStoreHeaders(),
    });
  }

  let body: BlockBody;
  try {
    body = (await request.json()) as BlockBody;
  } catch {
    return apiError("Solicitud invalida.", {
      status: 400,
      code: "INVALID_JSON",
      headers: noStoreHeaders(),
    });
  }

  const ip = sanitizeIp(body.ip);
  const action = body.action === "unblock" ? "unblock" : "block";

  if (!ip) {
    return apiError("IP requerida.", {
      status: 400,
      code: "IP_REQUIRED",
      headers: noStoreHeaders(),
    });
  }

  if (!isValidIpAddress(ip)) {
    return apiError(
      "Formato de IP inválido. Debe ser IPv4 o IPv6 válida.",
      { status: 400, code: "INVALID_IP_FORMAT", headers: noStoreHeaders() },
    );
  }

  if (action === "unblock") {
    unblockIp(ip);
    return apiOkFields(
      {
        action: "unblock",
        message: `IP ${ip} desbloqueada exitosamente.`,
      },
      { headers: noStoreHeaders() },
    );
  }

  const duration = body.duration;
  if (!isValidDuration(duration)) {
    return apiError("Duracion invalida. Usa: permanent, 24h o 1h.", {
      status: 400,
      code: "INVALID_DURATION",
      headers: noStoreHeaders(),
    });
  }

  const durationLabels: Record<BlockDuration, string> = {
    permanent: "Permanente",
    "24h": "24 horas",
    "1h": "1 hora",
  };

  blockIp(ip, duration, "Bloqueado por administrador");

  await sendBlockNotificationToDiscord(
    ip,
    durationLabels[duration],
    "Bloqueado por administrador",
  );

  return apiOkFields(
    {
      action: "block",
      ip,
      duration,
      message: `IP ${ip} bloqueada (${durationLabels[duration]}).`,
    },
    { headers: noStoreHeaders() },
  );
}

export async function GET() {
  return apiError(
    "Metodo no permitido. Usa POST con Authorization: Bearer <ADMIN_BLOCK_SECRET>.",
    { status: 405, code: "METHOD_NOT_ALLOWED", headers: noStoreHeaders() },
  );
}
