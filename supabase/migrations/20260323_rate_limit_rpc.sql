-- ============================================================
-- Vortixy: Durable rate-limit buckets
-- Generated: 2026-03-23
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny client access to rate_limits" ON rate_limits;

CREATE POLICY "Deny client access to rate_limits"
  ON rate_limits
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset
  ON rate_limits (reset_at);

CREATE OR REPLACE FUNCTION public.consume_rate_limit_bucket(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  retry_after_seconds INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  current_reset TIMESTAMPTZ;
  now_ts TIMESTAMPTZ;
  next_reset TIMESTAMPTZ;
BEGIN
  IF coalesce(trim(p_key), '') = '' OR coalesce(p_limit, 0) <= 0 OR coalesce(p_window_ms, 0) <= 0 THEN
    RAISE EXCEPTION 'Invalid rate-limit bucket input.';
  END IF;

  now_ts := clock_timestamp();
  next_reset := now_ts + make_interval(secs => greatest(p_window_ms, 1000) / 1000.0);

  LOOP
    UPDATE rate_limits
    SET
      count = CASE
        WHEN rate_limits.reset_at <= now_ts THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= now_ts THEN next_reset
        ELSE rate_limits.reset_at
      END
    WHERE rate_limits.key = p_key
    RETURNING rate_limits.count, rate_limits.reset_at
    INTO current_count, current_reset;

    IF FOUND THEN
      EXIT;
    END IF;

    BEGIN
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (p_key, 1, next_reset)
      RETURNING count, reset_at
      INTO current_count, current_reset;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        -- Another request won the insert. Retry the update branch.
    END;
  END LOOP;

  allowed := current_count <= p_limit;
  remaining := greatest(p_limit - current_count, 0);
  retry_after_seconds := CASE
    WHEN allowed THEN NULL
    ELSE greatest(1, ceil(extract(epoch FROM (current_reset - now_ts)))::INTEGER)
  END;
  reset_at := current_reset;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit_bucket(TEXT, INTEGER, INTEGER) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.consume_rate_limit_bucket(TEXT, INTEGER, INTEGER) FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.consume_rate_limit_bucket(TEXT, INTEGER, INTEGER) FROM authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_rate_limit_bucket(TEXT, INTEGER, INTEGER) TO service_role';
  END IF;
END
$$;
