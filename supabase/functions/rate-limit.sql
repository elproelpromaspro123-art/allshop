-- Rate Limiting Function for Supabase
-- This function implements a sliding window rate limit algorithm

-- Create the table for rate limit buckets if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    window_start BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_key ON public.rate_limit_buckets(key);

-- Create index on updated_at for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_updated ON public.rate_limit_buckets(updated_at);

-- Function to consume a rate limit bucket
-- Returns: {allowed: boolean, remaining: number, retry_after_seconds: number | null}
CREATE OR REPLACE FUNCTION public.consume_rate_limit_bucket(
    p_key TEXT,
    p_limit INTEGER,
    p_window_ms INTEGER
)
RETURNS TABLE(
    allowed BOOLEAN,
    remaining INTEGER,
    retry_after_seconds INTEGER
) AS $$
DECLARE
    v_count INTEGER;
    v_window_start BIGINT;
    v_now BIGINT;
    v_retry_after INTEGER;
BEGIN
    -- Get current timestamp in milliseconds
    v_now := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    
    -- Try to find existing bucket
    SELECT count, window_start
    INTO v_count, v_window_start
    FROM public.rate_limit_buckets
    WHERE key = p_key
    FOR UPDATE;
    
    -- If no bucket exists or window has expired, create/reset bucket
    IF v_count IS NULL OR (v_now - v_window_start) >= p_window_ms THEN
        INSERT INTO public.rate_limit_buckets (key, count, window_start, updated_at)
        VALUES (p_key, 1, v_now, NOW())
        ON CONFLICT (key) DO UPDATE
        SET count = 1,
            window_start = v_now,
            updated_at = NOW();
        
        RETURN QUERY SELECT 
            TRUE AS allowed,
            GREATEST(0, p_limit - 1) AS remaining,
            NULL::INTEGER AS retry_after_seconds;
    ELSE
        -- Window still active, check count
        IF v_count >= p_limit THEN
            -- Rate limit exceeded
            v_retry_after := CEIL((v_window_start + p_window_ms - v_now) / 1000.0)::INTEGER;
            
            RETURN QUERY SELECT 
                FALSE AS allowed,
                0 AS remaining,
                GREATEST(1, v_retry_after) AS retry_after_seconds;
        ELSE
            -- Increment count
            UPDATE public.rate_limit_buckets
            SET count = count + 1,
                updated_at = NOW()
            WHERE key = p_key;
            
            RETURN QUERY SELECT 
                TRUE AS allowed,
                GREATEST(0, p_limit - v_count - 1) AS remaining,
                NULL::INTEGER AS retry_after_seconds;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit buckets (call periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_buckets(
    p_max_age_ms INTEGER DEFAULT 3600000  -- Default: 1 hour
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
    v_cutoff BIGINT;
BEGIN
    v_cutoff := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 - p_max_age_ms;
    
    DELETE FROM public.rate_limit_buckets
    WHERE window_start < v_cutoff;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.consume_rate_limit_bucket TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_buckets TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.rate_limit_buckets TO authenticated;

COMMENT ON FUNCTION public.consume_rate_limit_bucket IS 'Check and consume a rate limit bucket. Returns allowed status, remaining requests, and retry-after seconds if rate limited.';
COMMENT ON FUNCTION public.cleanup_rate_limit_buckets IS 'Clean up old rate limit buckets older than specified age in milliseconds.';
