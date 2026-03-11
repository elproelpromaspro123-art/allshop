-- ============================================================
-- Vortixy: Database Migration — Security & Performance Fixes
-- Generated: 2026-03-11
-- ============================================================

-- 1. Orders: compound index for status + created_at
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders (status, created_at DESC);

-- 2. Products: index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON products (slug);

-- 3. Products: active filter for storefront queries
CREATE INDEX IF NOT EXISTS idx_products_active 
  ON products (is_active) WHERE is_active = true;

-- 4. Catalog runtime state: index for stock lookups
CREATE INDEX IF NOT EXISTS idx_catalog_runtime_slug 
  ON catalog_runtime_state (product_slug);

-- 5. Blocked IPs table (DB-backed IP blocking)
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip TEXT PRIMARY KEY,
  duration TEXT,
  reason TEXT DEFAULT 'Bloqueado',
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Clean up any previous policies
DROP POLICY IF EXISTS "Service role full access on blocked_ips" ON blocked_ips;
DROP POLICY IF EXISTS "Deny client access to blocked_ips" ON blocked_ips;

-- Explicitly deny all client access. service_role bypasses RLS automatically.
CREATE POLICY "Deny client access to blocked_ips"
  ON blocked_ips
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires 
  ON blocked_ips (expires_at) WHERE expires_at IS NOT NULL;

-- 6. Rate limits table (DB-backed rate limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Clean up any previous policies
DROP POLICY IF EXISTS "Service role full access on rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Deny client access to rate_limits" ON rate_limits;

-- Explicitly deny all client access. service_role bypasses RLS automatically.
CREATE POLICY "Deny client access to rate_limits"
  ON rate_limits
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset 
  ON rate_limits (reset_at);

-- 7. Optional: Cleanup cron jobs for expired data
-- SELECT cron.schedule('cleanup-rate-limits', '*/5 * * * *', 
--   $$DELETE FROM rate_limits WHERE reset_at < NOW()$$);
-- SELECT cron.schedule('cleanup-blocked-ips', '0 * * * *',
--   $$DELETE FROM blocked_ips WHERE expires_at IS NOT NULL AND expires_at < NOW()$$);

-- ============================================================
-- RLS STRATEGY:
-- ✅ RLS enabled (no "RLS Disabled" error)
-- ✅ Policy exists (no "No Policy" info)
-- ✅ Policy is NOT permissive (no "Always True" warning)
-- ✅ service_role bypasses RLS → backend works normally
-- ✅ anon/authenticated get DENIED → tables are invisible to clients
-- ============================================================
