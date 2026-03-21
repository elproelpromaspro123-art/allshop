-- ============================================
-- Allshop / Vortixy - 01_schema.sql
-- Base schema + seguridad + funciones operativas
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tables
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  compare_at_price INTEGER CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  images TEXT[] NOT NULL DEFAULT '{}',
  variants JSONB NOT NULL DEFAULT '[]',
  stock_location VARCHAR(20) NOT NULL DEFAULT 'nacional'
    CHECK (stock_location IN ('nacional', 'internacional', 'ambos')),
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  provider_api_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_document VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_department VARCHAR(100) NOT NULL,
  shipping_zip VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_id VARCHAR(255),
  payment_method VARCHAR(50),
  shipping_type VARCHAR(20) NOT NULL DEFAULT 'nacional'
    CHECK (shipping_type IN ('nacional')),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_cost INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(120),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(160),
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 10),
  variant VARCHAR(120),
  is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fulfillment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  payload JSONB,
  response JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  ip VARCHAR(45) PRIMARY KEY,
  duration VARCHAR(20) NOT NULL DEFAULT 'permanent',
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS catalog_runtime_state (
  product_slug VARCHAR(255) PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  total_stock INTEGER CHECK (total_stock IS NULL OR total_stock >= 0),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by VARCHAR(120),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_slug VARCHAR(255) NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  changed_by VARCHAR(120),
  source VARCHAR(50) NOT NULL DEFAULT 'admin_panel',
  change_type VARCHAR(50) NOT NULL DEFAULT 'price_stock_update',
  previous_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Compatibility alters
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS provider_api_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0;
ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS duration VARCHAR(20) NOT NULL DEFAULT 'permanent';
ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_public
  ON product_reviews(product_id, created_at DESC)
  WHERE is_approved = true AND is_verified_purchase = true;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_pending_created_at
  ON orders(created_at)
  WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_unique ON orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_runtime_state_updated_at
  ON catalog_runtime_state(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_audit_logs_product_created
  ON catalog_audit_logs(product_slug, created_at DESC);

-- ============================================
-- Triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_runtime_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Product reviews are viewable by everyone" ON product_reviews;
DROP POLICY IF EXISTS "Product reviews blocked for client roles" ON product_reviews;
DROP POLICY IF EXISTS "Orders blocked for client roles" ON orders;
DROP POLICY IF EXISTS "Fulfillment logs blocked for client roles" ON fulfillment_logs;
DROP POLICY IF EXISTS "Blocked IPs blocked for client roles" ON blocked_ips;
DROP POLICY IF EXISTS "Catalog runtime blocked for client roles" ON catalog_runtime_state;
DROP POLICY IF EXISTS "Catalog audit blocked for client roles" ON catalog_audit_logs;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "Product reviews are viewable by everyone"
  ON product_reviews FOR SELECT
  USING (is_approved = true AND is_verified_purchase = true);

CREATE POLICY "Product reviews blocked for client roles"
  ON product_reviews FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Orders blocked for client roles"
  ON orders FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Fulfillment logs blocked for client roles"
  ON fulfillment_logs FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Blocked IPs blocked for client roles"
  ON blocked_ips FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Catalog runtime blocked for client roles"
  ON catalog_runtime_state FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Catalog audit blocked for client roles"
  ON catalog_audit_logs FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- RPC helpers
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_variant_key(input_value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
  SELECT lower(trim(regexp_replace(coalesce(input_value, ''), '\s+', ' ', 'g')));
$$;

CREATE OR REPLACE FUNCTION public.reserve_catalog_stock(
  p_items JSONB,
  p_updated_by TEXT DEFAULT 'checkout'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  grouped_item RECORD;
  stock_row RECORD;
  variants_json JSONB;
  next_variants JSONB;
  variant_index INTEGER;
  variant_name TEXT;
  variant_stock INTEGER;
  next_total_stock INTEGER;
  reservations JSONB := '[]'::jsonb;
  qty INTEGER;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'No se recibieron items para reservar stock.',
      'reservations', '[]'::jsonb
    );
  END IF;

  FOR grouped_item IN
    SELECT
      lower(trim(item.slug)) AS slug,
      nullif(trim(item.variant), '') AS variant,
      SUM(GREATEST(0, floor(item.quantity)::int))::int AS qty
    FROM jsonb_to_recordset(p_items) AS item(slug TEXT, variant TEXT, quantity NUMERIC)
    WHERE coalesce(trim(item.slug), '') <> ''
      AND floor(coalesce(item.quantity, 0))::int > 0
    GROUP BY 1, 2
  LOOP
    qty := grouped_item.qty;
    IF qty IS NULL OR qty <= 0 THEN
      CONTINUE;
    END IF;

    SELECT product_slug, total_stock, variants
    INTO stock_row
    FROM catalog_runtime_state
    WHERE product_slug = grouped_item.slug
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'ok', false,
        'message', format('No existe stock operativo para %s.', grouped_item.slug),
        'reservations', reservations
      );
    END IF;

    variants_json := coalesce(stock_row.variants, '[]'::jsonb);
    IF jsonb_typeof(variants_json) <> 'array' THEN
      variants_json := '[]'::jsonb;
    END IF;
    next_variants := variants_json;
    variant_index := NULL;
    variant_name := NULL;

    IF jsonb_array_length(variants_json) > 0 THEN
      IF grouped_item.variant IS NULL AND jsonb_array_length(variants_json) = 1 THEN
        variant_index := 0;
        variant_name := coalesce(next_variants->0->>'name', grouped_item.variant);
      ELSIF grouped_item.variant IS NOT NULL THEN
        SELECT i, coalesce(next_variants->i->>'name', grouped_item.variant)
        INTO variant_index, variant_name
        FROM generate_series(0, jsonb_array_length(next_variants) - 1) AS i
        WHERE public.normalize_variant_key(next_variants->i->>'name')
          = public.normalize_variant_key(grouped_item.variant)
        LIMIT 1;
      ELSIF jsonb_array_length(variants_json) > 1 THEN
        RETURN jsonb_build_object(
          'ok', false,
          'message', format('Debes indicar variante para %s.', grouped_item.slug),
          'reservations', reservations
        );
      END IF;
    END IF;

    IF variant_index IS NOT NULL THEN
      variant_stock := NULLIF(next_variants->variant_index->>'stock', '')::int;

      IF variant_stock IS NOT NULL AND variant_stock < qty THEN
        RETURN jsonb_build_object(
          'ok', false,
          'message', format('Sin stock suficiente en %s (%s).', grouped_item.slug, coalesce(variant_name, grouped_item.variant)),
          'reservations', reservations
        );
      END IF;

      IF variant_stock IS NOT NULL THEN
        next_variants := jsonb_set(
          next_variants,
          ARRAY[variant_index::text, 'stock'],
          to_jsonb(greatest(0, variant_stock - qty)),
          false
        );
      END IF;
    END IF;

    next_total_stock := stock_row.total_stock;
    IF next_total_stock IS NOT NULL THEN
      IF next_total_stock < qty THEN
        RETURN jsonb_build_object(
          'ok', false,
          'message', format('Sin stock total suficiente para %s.', grouped_item.slug),
          'reservations', reservations
        );
      END IF;
      next_total_stock := greatest(0, next_total_stock - qty);
    END IF;

    UPDATE catalog_runtime_state
    SET
      total_stock = next_total_stock,
      variants = next_variants,
      updated_by = coalesce(nullif(trim(p_updated_by), ''), 'checkout'),
      updated_at = now()
    WHERE product_slug = grouped_item.slug;

    reservations := reservations || jsonb_build_array(
      jsonb_build_object(
        'slug', grouped_item.slug,
        'variant', coalesce(variant_name, grouped_item.variant),
        'quantity', qty
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Stock reservado correctamente.',
    'reservations', reservations
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_catalog_stock(
  p_reservations JSONB,
  p_updated_by TEXT DEFAULT 'checkout_rollback'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  grouped_item RECORD;
  stock_row RECORD;
  variants_json JSONB;
  next_variants JSONB;
  variant_index INTEGER;
  variant_stock INTEGER;
  next_total_stock INTEGER;
  qty INTEGER;
BEGIN
  IF p_reservations IS NULL OR jsonb_typeof(p_reservations) <> 'array' OR jsonb_array_length(p_reservations) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'message', 'Sin reservas para restaurar.');
  END IF;

  FOR grouped_item IN
    SELECT
      lower(trim(item.slug)) AS slug,
      nullif(trim(item.variant), '') AS variant,
      SUM(GREATEST(0, floor(item.quantity)::int))::int AS qty
    FROM jsonb_to_recordset(p_reservations) AS item(slug TEXT, variant TEXT, quantity NUMERIC)
    WHERE coalesce(trim(item.slug), '') <> ''
      AND floor(coalesce(item.quantity, 0))::int > 0
    GROUP BY 1, 2
  LOOP
    qty := grouped_item.qty;
    IF qty IS NULL OR qty <= 0 THEN
      CONTINUE;
    END IF;

    SELECT product_slug, total_stock, variants
    INTO stock_row
    FROM catalog_runtime_state
    WHERE product_slug = grouped_item.slug
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    variants_json := coalesce(stock_row.variants, '[]'::jsonb);
    IF jsonb_typeof(variants_json) <> 'array' THEN
      variants_json := '[]'::jsonb;
    END IF;
    next_variants := variants_json;
    variant_index := NULL;

    IF jsonb_array_length(next_variants) > 0 THEN
      IF grouped_item.variant IS NULL AND jsonb_array_length(next_variants) = 1 THEN
        variant_index := 0;
      ELSIF grouped_item.variant IS NOT NULL THEN
        SELECT i
        INTO variant_index
        FROM generate_series(0, jsonb_array_length(next_variants) - 1) AS i
        WHERE public.normalize_variant_key(next_variants->i->>'name')
          = public.normalize_variant_key(grouped_item.variant)
        LIMIT 1;
      END IF;
    END IF;

    IF variant_index IS NOT NULL THEN
      variant_stock := NULLIF(next_variants->variant_index->>'stock', '')::int;
      IF variant_stock IS NOT NULL THEN
        next_variants := jsonb_set(
          next_variants,
          ARRAY[variant_index::text, 'stock'],
          to_jsonb(greatest(0, variant_stock + qty)),
          false
        );
      END IF;
    END IF;

    next_total_stock := stock_row.total_stock;
    IF next_total_stock IS NOT NULL THEN
      next_total_stock := greatest(0, next_total_stock + qty);
    END IF;

    UPDATE catalog_runtime_state
    SET
      total_stock = next_total_stock,
      variants = next_variants,
      updated_by = coalesce(nullif(trim(p_updated_by), ''), 'checkout_rollback'),
      updated_at = now()
    WHERE product_slug = grouped_item.slug;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'message', 'Stock restaurado.');
END;
$$;

COMMIT;
