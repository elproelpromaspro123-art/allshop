import { NextRequest, NextResponse } from "next/server";
import { blockIp, unblockIp } from "@/lib/ip-block";
import { sendBlockNotificationToDiscord } from "@/lib/discord";
import {
  isAdminActionSecretConfigured,
  isAdminActionSecretValid,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isValidIpAddress, getClientIp } from "@/lib/utils";

type BlockDuration = "permanent" | "24h" | "1h";

interface BlockBody {
  ip?: string;
  duration?: BlockDuration;
  action?: "block" | "unblock";
}

function getAuthorizedToken(request: NextRequest): string {
  return parseBearerToken(request.headers.get("authorization"));
}

function assertAdminAccess(request: NextRequest): NextResponse | null {
  if (!isAdminActionSecretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Configura ADMIN_BLOCK_SECRET (o ORDER_LOOKUP_SECRET) para habilitar este endpoint.",
      },
      { status: 500 }
    );
  }

  const token = getAuthorizedToken(request);
  if (!isAdminActionSecretValid(token)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  return null;
}

function sanitizeIp(value: unknown): string {
  return String(value || "").trim();
}

function isValidDuration(value: unknown): value is BlockDuration {
  return value === "permanent" || value === "24h" || value === "1h";
}

export async function POST(request: NextRequest) {
  // Rate limiting for admin endpoints (fix 1.11)
  const clientIp = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `admin-block:${clientIp}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const authError = assertAdminAccess(request);
  if (authError) return authError;

  let body: BlockBody;
  try {
    body = (await request.json()) as BlockBody;
  } catch {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  const ip = sanitizeIp(body.ip);
  const action = body.action === "unblock" ? "unblock" : "block";

  if (!ip) {
    return NextResponse.json({ error: "IP requerida." }, { status: 400 });
  }

  // Validate IP format (fix 1.10)
  if (!isValidIpAddress(ip)) {
    return NextResponse.json(
      { error: "Formato de IP inválido. Debe ser IPv4 o IPv6 válida." },
      { status: 400 }
    );
  }

  if (action === "unblock") {
    unblockIp(ip);
    return NextResponse.json({
      ok: true,
      action: "unblock",
      message: `IP ${ip} desbloqueada exitosamente.`,
    });
  }

  const duration = body.duration;
  if (!isValidDuration(duration)) {
    return NextResponse.json(
      { error: "Duracion invalida. Usa: permanent, 24h o 1h." },
      { status: 400 }
    );
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
    "Bloqueado por administrador"
  );

  return NextResponse.json({
    ok: true,
    action: "block",
    ip,
    duration,
    message: `IP ${ip} bloqueada (${durationLabels[duration]}).`,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Metodo no permitido. Usa POST con Authorization: Bearer <ADMIN_BLOCK_SECRET>.",
    },
    { status: 405 }
  );
}
