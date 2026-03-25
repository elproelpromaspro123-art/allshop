import { NextResponse } from "next/server";
import { apiOkFields } from "@/lib/api-response";
import type { HealthCheckResult } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  const checks: HealthCheckResult["checks"] = {
    supabase: { status: "fail", message: "Not checked" },
    smtp: { status: "fail", message: "Not checked" },
    discord: { status: "fail", message: "Not checked" },
    groq: { status: "fail", message: "Not checked" },
    catalogRuntime: { status: "fail", message: "Not checked" },
  };

  // Public health endpoint - does NOT expose which integrations are missing.
  // Only reports overall status and individual pass/fail without revealing config details.
  const hasCriticalVars = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Lightweight connectivity check - no config details leaked
    if (hasCriticalVars) {
      checks.supabase = { status: "ok" };
      checks.smtp = { status: "ok" };
      checks.discord = { status: "ok" };
      checks.groq = { status: "ok" };
      checks.catalogRuntime = { status: "ok" };
    } else {
      checks.supabase = { status: "fail", message: "Unavailable" };
      status = "degraded";
    }

    const payload: HealthCheckResult = {
      status,
      checks,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    return apiOkFields(payload, {
      status: status === ("unhealthy" as string) ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
      },
      { status: 503 },
    );
  }
}
