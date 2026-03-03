import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseClientConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your_supabase_url" &&
    supabaseAnonKey !== "your_supabase_anon_key"
);

const safeUrl = isSupabaseClientConfigured
  ? supabaseUrl!
  : "https://example.supabase.co";
const safeAnonKey = isSupabaseClientConfigured ? supabaseAnonKey! : "public-anon-key";

export const supabase = createClient(safeUrl, safeAnonKey);
