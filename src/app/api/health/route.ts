import { NextResponse } from "next/server";
import { apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { getGroqApiKey, readEnvValue } from "@/lib/env";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import type { HealthCheckResult } from "@/types/api";

export const dynamic = "force-dynamic";

function createCheck(
  status: HealthCheckResult["checks"]["supabase"]["status"],
  message?: string,
  latencyMs?: number,
) {
  return {
    status,
    ...(message ? { message } : {}),
    ...(typeof latencyMs === "number" ? { latencyMs } : {}),
  };
}

async function measureCheck(
  runner: () => Promise<HealthCheckResult["checks"]["supabase"]>,
): Promise<HealthCheckResult["checks"]["supabase"]> {
  const startedAt = performance.now();

  try {
    const result = await runner();
    return {
      ...result,
      latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
    };
  } catch {
    return {
      status: "fail",
      message: "Unavailable",
      latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
    };
  }
}

async function runSupabaseProbe(
  query: "products" | "categories",
): Promise<HealthCheckResult["checks"]["supabase"]> {
  if (!isSupabaseAdminConfigured) {
    return createCheck("fail", "Unavailable");
  }

  const { error } = await supabaseAdmin.from(query).select("id").limit(1);

  if (error) {
    return createCheck("fail", "Unavailable");
  }

  return createCheck("ok", "Connected");
}

export async function GET() {
  try {
    const [supabaseCheck, catalogRuntimeCheck, smtpConfigured, discordConfigured, groqConfigured] =
      await Promise.all([
        measureCheck(() => runSupabaseProbe("products")),
        measureCheck(() => runSupabaseProbe("categories")),
        Promise.resolve(
          Boolean(readEnvValue("SMTP_USER")) && Boolean(readEnvValue("SMTP_PASSWORD")),
        ),
        Promise.resolve(Boolean(readEnvValue("DISCORD_WEBHOOK_URL"))),
        Promise.resolve(Boolean(getGroqApiKey())),
      ]);

    const checks: HealthCheckResult["checks"] = {
      supabase: supabaseCheck,
      catalogRuntime: catalogRuntimeCheck,
      smtp: smtpConfigured ? createCheck("ok", "Configured") : createCheck("warn", "Unavailable"),
      discord: discordConfigured
        ? createCheck("ok", "Configured")
        : createCheck("warn", "Unavailable"),
      groq: groqConfigured ? createCheck("ok", "Configured") : createCheck("warn", "Unavailable"),
    };

    const hasFailure = Object.values(checks).some((check) => check.status === "fail");
    const hasWarning = Object.values(checks).some((check) => check.status === "warn");
    const status: HealthCheckResult["status"] = hasFailure
      ? "unhealthy"
      : hasWarning
        ? "degraded"
        : "healthy";

    const payload: HealthCheckResult = {
      status,
      checks,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    return apiOkFields(payload, {
      status: status === "unhealthy" ? 503 : 200,
      headers: noStoreHeaders(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
      },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}
