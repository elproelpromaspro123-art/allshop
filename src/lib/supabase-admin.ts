import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin Supabase client with service role key.
 *
 * NOTE: This client is intentionally NOT typed with the Database generic
 * because Supabase admin is used for dynamic tables (catalog_runtime_state,
 * blocked_ips, rate_limits, catalog_audit_logs) and RPC functions that
 * are not all captured in the Database type. Using untyped client avoids
 * false-positive TypeScript errors while maintaining runtime correctness.
 *
 * For type safety on core tables, use the typed public client instead.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl !== "your_supabase_url" &&
  supabaseServiceKey !== "your_supabase_service_role_key",
);

const safeUrl = isSupabaseAdminConfigured
  ? supabaseUrl!
  : "https://example.supabase.co";
const safeServiceKey = isSupabaseAdminConfigured
  ? supabaseServiceKey!
  : "service-role-key";

export const supabaseAdmin = createClient(safeUrl, safeServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
