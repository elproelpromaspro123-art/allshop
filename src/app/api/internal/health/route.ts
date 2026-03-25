import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  checks: {
    supabase: { ok: boolean; error?: string };
    env: { ok: boolean; missing: string[] };
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const checks: HealthStatus["checks"] = {
    supabase: { ok: false },
    env: { ok: true, missing: [] },
  };

  // Internal health check - verify secrets exist but don't list which ones are missing
  const hasCriticalVars = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    (process.env.CSRF_SECRET || process.env.ORDER_LOOKUP_SECRET) &&
    process.env.ORDER_LOOKUP_SECRET
  );

  if (!hasCriticalVars) {
    checks.env = { ok: false, missing: ["[redacted]"] };
  }

  if (isSupabaseAdminConfigured) {
    try {
      const { error } = await supabaseAdmin.from("products").select("id").limit(1);
      if (error) {
        checks.supabase = { ok: false, error: error.message };
      } else {
        checks.supabase = { ok: true };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      checks.supabase = { ok: false, error: message };
    }
  } else {
    checks.supabase = { ok: false, error: "Supabase admin not configured" };
  }

  const allOk = checks.supabase.ok && checks.env.ok;
  const status: HealthStatus["status"] = allOk ? "ok" : checks.supabase.ok ? "degraded" : "error";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks,
    } satisfies HealthStatus,
    {
      status: status === "error" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}
