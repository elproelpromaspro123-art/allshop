BEGIN;

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fulfillment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalog_runtime_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders blocked for client roles" ON public.orders;
DROP POLICY IF EXISTS "Fulfillment logs blocked for client roles" ON public.fulfillment_logs;
DROP POLICY IF EXISTS "Catalog runtime blocked for client roles" ON public.catalog_runtime_state;

CREATE POLICY "Orders blocked for client roles"
  ON public.orders AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Fulfillment logs blocked for client roles"
  ON public.fulfillment_logs AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Catalog runtime blocked for client roles"
  ON public.catalog_runtime_state AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMIT;
