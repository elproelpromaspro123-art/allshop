import { NextResponse } from "next/server";
import { apiOkFields } from "@/lib/api-response";
import { isGroqConfigured } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { isEmailConfigured } from "@/lib/notifications";
import { isDiscordConfigured } from "@/lib/discord";
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

  try {
    // 1. Check Supabase DB connection via simple query
    const supabaseStart = Date.now();
    try {
      const { error } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (error) {
        checks.supabase = { status: "fail", message: error.message };
        status = "degraded";
      } else {
        checks.supabase = {
          status: "ok",
          latencyMs: Date.now() - supabaseStart,
        };
      }
    } catch (e) {
      checks.supabase = {
        status: "fail",
        message: e instanceof Error ? e.message : "Unknown error",
      };
      status = "degraded";
    }

    // 2. Check SMTP Configuration
    try {
      if (isEmailConfigured()) {
        checks.smtp = { status: "ok", message: "Configured" };
      } else {
        checks.smtp = {
          status: "warn",
          message: "Not configured (fallback active)",
        };
      }
    } catch {
      checks.smtp = { status: "fail", message: "Error checking status" };
    }

    // 3. Check Discord Webhook Configuration
    try {
      if (isDiscordConfigured()) {
        checks.discord = { status: "ok", message: "Configured" };
      } else {
        // Warning, not fail, because Discord isn't strictly required to sell
        checks.discord = {
          status: "warn",
          message: "Not configured (fallback active)",
        };
      }
    } catch {
      checks.discord = { status: "fail", message: "Error checking status" };
    }

    // 4. Check Groq API (Chatbot)
    try {
      if (isGroqConfigured()) {
        checks.groq = { status: "ok", message: "Configured" };
      } else {
        checks.groq = {
          status: "warn",
          message: "Not configured (fallback active)",
        };
      }
    } catch {
      checks.groq = { status: "fail", message: "Error checking status" };
    }

    // 5. Check Catalog Runtime Table
    const runtimeStart = Date.now();
    try {
      const { error } = await supabase
        .from("catalog_runtime_state")
        .select("slug")
        .limit(1);

      if (error) {
        // If the table doesn't exist, it's a fail (needs migration)
        checks.catalogRuntime = { status: "fail", message: error.message };
        status = "degraded";
      } else {
        checks.catalogRuntime = {
          status: "ok",
          latencyMs: Date.now() - runtimeStart,
        };
      }
    } catch (e) {
      checks.catalogRuntime = {
        status: "fail",
        message: e instanceof Error ? e.message : "Unknown error",
      };
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
  } catch (globalError) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error:
          globalError instanceof Error ? globalError.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
