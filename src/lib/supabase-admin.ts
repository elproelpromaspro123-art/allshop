import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    supabaseUrl !== "your_supabase_url" &&
    supabaseServiceKey !== "your_supabase_service_role_key"
);

const safeUrl = isSupabaseAdminConfigured ? supabaseUrl! : "https://example.supabase.co";
const safeServiceKey = isSupabaseAdminConfigured ? supabaseServiceKey! : "service-role-key";

export const supabaseAdmin = createClient(safeUrl, safeServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
