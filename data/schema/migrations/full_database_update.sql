-- ============================================
-- Vortixy / Allshop - FULL DATABASE UPDATE
-- Fecha: 2026-03-08
-- Orden recomendado:
-- 1) Ejecutar este archivo completo en Supabase SQL Editor
-- ============================================

-- Este archivo consolida:
-- - sql/01_schema.sql
-- - sql/02_seed_catalog.sql
-- - sql/03_runtime_stock.sql
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
  video_url TEXT,
  variants JSONB NOT NULL DEFAULT '[]',
  stock_location VARCHAR(20) NOT NULL DEFAULT 'nacional'
    CHECK (stock_location IN ('nacional', 'internacional', 'ambos')),
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  shipping_cost INTEGER,
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
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
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

-- ============================================
-- RPC helpers
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_variant_key(input_value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
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


-- ============================================
-- Allshop / Vortixy - 02_seed_catalog.sql
-- Categorias + catalogo canonico (11 productos)
-- ============================================

BEGIN;

INSERT INTO categories (name, slug, description, image_url, icon, color)
VALUES
  ('Cocina', 'cocina', 'Soluciones inteligentes que transforman tu cocina en un espacio organizado y funcional', '/categories/cocina.jpg', 'ChefHat', '#F97316'),
  ('Tecnologia', 'tecnologia', 'Tecnologia practica que simplifica tu vida y potencia tu productividad', '/categories/tecnologia.jpg', 'Smartphone', '#3B82F6'),
  ('Hogar', 'hogar', 'Productos premium que hacen de tu hogar un lugar mas comodo y eficiente', '/categories/hogar.jpg', 'Home', '#10B981'),
  ('Belleza', 'belleza', 'Herramientas profesionales de belleza para resultados de salon en casa', '/categories/belleza.jpg', 'Sparkles', '#EC4899'),
  ('Fitness', 'fitness', 'Equipamiento esencial para tu bienestar fisico y recuperacion muscular', '/categories/fitness.jpg', 'Dumbbell', '#8B5CF6')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

WITH category_ids AS (
  SELECT slug, id
  FROM categories
  WHERE slug IN ('cocina', 'tecnologia', 'hogar', 'belleza', 'fitness')
),
desired AS (
  SELECT
    v.*,
    CASE
      WHEN v.slug = 'airpods-pro-3' THEN '/productos/airpods-pro-3/airpods-pro-3-showcase.mp4'
      ELSE NULL
    END AS video_url
  FROM (
    VALUES
      (
        'airpods-pro-3',
        'AirPods Pro 3 con Cancelación de Ruido',
        'Audífonos in-ear con cancelación activa de ruido, audio espacial, traducción en vivo y batería de hasta 30 horas para uso diario.',
        160000,
        229000,
        'tecnologia',
        ARRAY[
          '/productos/airpods-pro-3/airpods-pro-3-detail-3.jpeg',
          '/productos/airpods-pro-3/airpods-pro-3-detail-1.jpeg',
          '/productos/airpods-pro-3/airpods-pro-3-detail-2.jpeg',
          '/productos/airpods-pro-3/airpods-pro-3-detail-4.jpeg',
          '/productos/airpods-pro-3/airpods-pro-3-detail-5.jpeg',
          '/productos/airpods-pro-3/airpods-pro-3-detail-6.jpeg',
          '/productos/airpods-pro-3/airpods-pro-3-hero-1.png',
          '/productos/airpods-pro-3/airpods-pro-3-hero-2.png'
        ]::text[],
        '[{"name":"Color","options":["BLANCO"]}]'::jsonb,
        true,
        true,
        true,
        'AirPods Pro 3 con Cancelación de Ruido',
        'AirPods Pro 3 con cancelación activa de ruido, traducción en vivo, audio espacial y envío gratis.'
      ),
      (
        'audifonos-xiaomi-redmi-buds-4-lite',
        'Audifonos xiaomi Redmi Buds 4 Lite',
        'Audifonos Bluetooth 5.3 con conexion estable, diseno liviano e IP54 para uso diario.',
        85000,
        119000,
        'tecnologia',
        ARRAY[
          '/productos/audifonos-xiaomi-redmi-buds-4-lite/1743447396buds4-1.png',
          '/productos/audifonos-xiaomi-redmi-buds-4-lite/1743447396buds4-2.png',
          '/productos/audifonos-xiaomi-redmi-buds-4-lite/1743447396buds4-W-1.png',
          '/productos/audifonos-xiaomi-redmi-buds-4-lite/1743447396buds4-W.png',
          '/productos/audifonos-xiaomi-redmi-buds-4-lite/1743447396buds4.png'
        ]::text[],
        '[{"name":"Color","options":["NEGRO","BLANCO"]}]'::jsonb,
        true,
        true,
        true,
        'Audifonos Xiaomi Redmi Buds 4 Lite',
        'Redmi Buds 4 Lite con Bluetooth 5.3 y bateria de larga duracion.'
      ),
      (
        'camara-seguridad-bombillo-360-wifi',
        'Camara De Seguridad Wifi Bombillo 360',
        'Camara tipo bombillo E27 con vista 360, audio bidireccional y vision nocturna.',
        69000,
        89900,
        'hogar',
        ARRAY[
          '/productos/camara-seguridad-bombillo-360-wifi/1771863986CAMARA-IP-1.png',
          '/productos/camara-seguridad-bombillo-360-wifi/1771863986CAMARA-IP-2.png',
          '/productos/camara-seguridad-bombillo-360-wifi/1771863986CAMARA-IP-3.png'
        ]::text[],
        '[{"name":"Tipo de Montura","options":["E27 (ESTANDAR)"]}]'::jsonb,
        true,
        true,
        true,
        'Camara Wifi Bombillo 360',
        'Camara de seguridad con rotacion horizontal y vertical para interiores.'
      ),
      (
        'smartwatch-ultra-series-pantalla-grande',
        'Reloj Inteligente Pantalla Grande Tactil',
        'Smartwatch de pantalla amplia para notificaciones y monitoreo basico diario.',
        142000,
        189000,
        'tecnologia',
        ARRAY[
          '/productos/smartwatch-ultra-series-pantalla-grande/177007082533.png',
          '/productos/smartwatch-ultra-series-pantalla-grande/177007082534.png',
          '/productos/smartwatch-ultra-series-pantalla-grande/ChatGPT_Image_3_mar_2026__11_02_54_p.m.-removebg-preview.png'
        ]::text[],
        '[{"name":"Color Correa","options":["NARANJA"]}]'::jsonb,
        true,
        true,
        false,
        'Smartwatch Ultra Series Pantalla Grande',
        'Reloj inteligente de uso diario con pantalla tactil y correa ajustable.'
      ),
      (
        'silla-gamer-premium-reposapies',
        'SILLA GAMER CON REPOSAPIES',
        'Silla ergonomica con soporte lumbar, reposapies y reclinacion para uso prolongado.',
        499000,
        549000,
        'hogar',
        ARRAY[
          '/productos/silla-gamer-premium-reposapies/negro-con-rojo.jpeg',
          '/productos/silla-gamer-premium-reposapies/silla-negra.jpeg',
          '/productos/silla-gamer-premium-reposapies/negro-con-blanco.jpeg',
          '/productos/silla-gamer-premium-reposapies/silla-negra-con-gris.jpeg',
          '/productos/silla-gamer-premium-reposapies/silla-negra-con-gris-segunda-visualizacion.jpeg',
          '/productos/silla-gamer-premium-reposapies/silla-rosa.jpeg'
        ]::text[],
        '[{"name":"Color","options":["NEGRO ROJO","NEGRO AZUL","NEGRO","NEGRO BLANCO","NEGRO GRIS","ROSA"]}]'::jsonb,
        true,
        true,
        true,
        'Silla Gamer Premium con Reposapies',
        'Silla gamer ergonomica con base robusta y reclinacion ajustable.'
      ),
      (
        'cepillo-electrico-5-en-1-secador-alisador',
        'Cepillo Electrico 5 En 1 Secador Alisado',
        'Herramienta 5 en 1 para secar, alisar y ondular con accesorios intercambiables.',
        75000,
        129000,
        'belleza',
        ARRAY[
          '/productos/cepillo-electrico-5-en-1-secador-alisador/1764262734Cepillo-secador-5-en-1-(3).png',
          '/productos/cepillo-electrico-5-en-1-secador-alisador/1764262735Cepillo-secador-5-en-1-(1).png',
          '/productos/cepillo-electrico-5-en-1-secador-alisador/1764262735Cepillo-secador-5-en-1-(2).png',
          '/productos/cepillo-electrico-5-en-1-secador-alisador/1764262735Cepillo-secador-5-en-1.png'
        ]::text[],
        '[{"name":"Color","options":["NEGRO"]}]'::jsonb,
        true,
        true,
        false,
        'Cepillo Electrico 5 en 1',
        'Cepillo de aire caliente con niveles de temperatura y accesorios de peinado.'
      ),
      (
        'air-fryer-freidora-10l-premium',
        'Freidora 10L Premium',
        'Freidora de aire de 10L para porciones grandes, coccion uniforme y uso familiar.',
        349000,
        499000,
        'cocina',
        ARRAY[
          '/productos/air-fryer-freidora-10l-premium/1757706558D_NQ_NP_620013-MCO89672231768_082025-O.webp',
          '/productos/air-fryer-freidora-10l-premium/1757706558D_NQ_NP_723096-MCO89672092094_082025-O.webp',
          '/productos/air-fryer-freidora-10l-premium/1757706558D_NQ_NP_793140-MCO89672330972_082025-O.webp',
          '/productos/air-fryer-freidora-10l-premium/1757706558D_NQ_NP_822739-MCO89672072432_082025-O.webp',
          '/productos/air-fryer-freidora-10l-premium/1757706558D_NQ_NP_836983-MCO89672142028_082025-O.webp'
        ]::text[],
        '[{"name":"Color","options":["ACERO INOXIDABLE/NEGRO"]}]'::jsonb,
        true,
        true,
        true,
        'Freidora de Aire 10L Premium',
        'Air fryer de 10 litros para cocina diaria y alto volumen.'
      ),
      (
        'lampara-mata-zancudos-electrica',
        'Lampara Mata Zancudos Electrica',
        'Lampara UV para control de zancudos en interiores con rejilla electrica de eliminacion inmediata.',
        65000,
        99000,
        'hogar',
        ARRAY[
          '/productos/lampara-mata-zancudos-electrica/17023038731702303873Screen-Shot-2023-03-08-at-1.23.51-PM.png',
          '/productos/lampara-mata-zancudos-electrica/17023038731702303873Screen-Shot-2023-03-08-at-1.24.27-PM.png',
          '/productos/lampara-mata-zancudos-electrica/17023038731702303873Screen-Shot-2023-03-08-at-1.26.51-PM.png'
        ]::text[],
        '[{"name":"Color","options":["BLANCO"]}]'::jsonb,
        true,
        true,
        false,
        'Lampara Mata Zancudos Electrica',
        'Control de insectos para interiores con operacion silenciosa y bajo consumo.'
      ),
      (
        'aspiradora-inalambrica-de-mano',
        'Aspiradora Inalambrica de Mano 3 en 1',
        'Aspiradora portatil inalambrica para limpieza de hogar, carro y oficina.',
        89900,
        129900,
        'hogar',
        ARRAY[
          '/productos/aspiradora-inalambrica-de-mano/17018727001701872700aspira1.jpeg',
          '/productos/aspiradora-inalambrica-de-mano/17018727001701872700aspira3.jpeg',
          '/productos/aspiradora-inalambrica-de-mano/1701872700170187270051-T3-9eigl.jpg',
          '/productos/aspiradora-inalambrica-de-mano/1701872700170187270061rwx3iztyl.jpg'
        ]::text[],
        '[{"name":"Color","options":["UNICO"]}]'::jsonb,
        true,
        true,
        false,
        'Aspiradora Inalambrica de Mano',
        'Aspiradora compacta recargable con accesorios 3 en 1 para limpieza rapida.'
      ),
      (
        'combo-cargador-4-en-1-adaptadorcable',
        'Combo Cargador 4 En 1 Adaptadorcable',
        'Combo de cargador y cable multifuncional 4 en 1 para USB-C, USB-A y Lightning.',
        69900,
        109000,
        'tecnologia',
        ARRAY[
          '/productos/combo-cargador-4-en-1-adaptadorcable/1768876712combocargador4en1-1.png',
          '/productos/combo-cargador-4-en-1-adaptadorcable/1768876712combocargador4en1-2.png',
          '/productos/combo-cargador-4-en-1-adaptadorcable/1768876713combocargador4en1-3.png',
          '/productos/combo-cargador-4-en-1-adaptadorcable/1768876713cable4en1.png',
          '/productos/combo-cargador-4-en-1-adaptadorcable/1768876712cable4en1-2.png'
        ]::text[],
        '[{"name":"Color","options":["UNICO"]}]'::jsonb,
        true,
        true,
        false,
        'Combo Cargador 4 en 1',
        'Carga y sincroniza varios dispositivos con un solo combo de alta salida.'
      ),
      (
        'corrector-de-postura',
        'Corrector De Postura Ajustable',
        'Corrector de postura ajustable y transpirable para soporte diario en espalda y hombros. Ideal para oficina, estudio y rutinas de uso prolongado.',
        39000,
        49900,
        'fitness',
        ARRAY[
          '/productos/corrector-de-postura/corrector-postura-1.png',
          '/productos/corrector-de-postura/corrector-postura-2.png',
          '/productos/corrector-de-postura/corrector-postura-3.png',
          '/productos/corrector-de-postura/corrector-postura-4.jpg',
          '/productos/corrector-de-postura/corrector-postura-5.jpg',
          '/productos/corrector-de-postura/corrector-postura-6.jpg'
        ]::text[],
        '[{"name":"Talla","options":["S","M","L","XL","XXL","XXXL"]}]'::jsonb,
        true,
        true,
        false,
        'Corrector de Postura Ajustable',
        'Corrector de postura ajustable con tallas S a XXXL para uso diario y soporte comodo.'
      ),
      (
        'depilador-facial-electrico-recargable',
        'Depilador Facial Electrico Recargable',
        'Depilador tipo labial para retoques faciales rapidos con luz integrada.',
        44900,
        79000,
        'belleza',
        ARRAY[
          '/productos/depilador-facial-electrico-recargable/17690265922093269413-1615153132888.png'
        ]::text[],
        '[{"name":"Color","options":["UNICO"]}]'::jsonb,
        true,
        true,
        false,
        'Depilador Facial Electrico Recargable',
        'Depilador compacto y practico para cuidado personal diario en casa o viaje.'
      )
  ) AS v(
    slug,
    name,
    description,
    price,
    compare_at_price,
    category_slug,
    images,
    variants,
    is_featured,
    is_active,
    is_bestseller,
    meta_title,
    meta_description
  )
),
upserted AS (
  INSERT INTO products (
    name,
    slug,
    description,
    price,
    compare_at_price,
    category_id,
    images,
    video_url,
    variants,
    stock_location,
    free_shipping,
    shipping_cost,
    provider_api_url,
    is_featured,
    is_active,
    is_bestseller,
    meta_title,
    meta_description,
    updated_at
  )
  SELECT
    d.name,
    d.slug,
    d.description,
    d.price,
    d.compare_at_price,
    c.id,
    d.images,
    d.video_url,
    d.variants,
    'nacional',
    false,
    null,
    null,
    d.is_featured,
    d.is_active,
    d.is_bestseller,
    d.meta_title,
    d.meta_description,
    NOW()
  FROM desired d
  JOIN category_ids c ON c.slug = d.category_slug
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    category_id = EXCLUDED.category_id,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url,
    variants = EXCLUDED.variants,
    free_shipping = EXCLUDED.free_shipping,
    shipping_cost = EXCLUDED.shipping_cost,
    stock_location = EXCLUDED.stock_location,
    provider_api_url = EXCLUDED.provider_api_url,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    is_bestseller = EXCLUDED.is_bestseller,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    updated_at = NOW()
  RETURNING id, slug
)
UPDATE products p
SET is_active = false,
    updated_at = NOW()
WHERE p.slug IN (
  'xiaomi-redmi-airdots-s',
  'auriculares-xiaomi-redmi-airdots-s',
  'xiaomi-redmi-buds-4-lite',
  'aire-acondicionado-portatil-arctic-ice',
  'arctic-air-ice-jet',
  'camara-seguridad-bombillo-360'
)
AND p.slug NOT IN (SELECT slug FROM upserted);

UPDATE products
SET free_shipping = false,
    shipping_cost = null,
    updated_at = NOW()
WHERE slug = 'corrector-de-postura';

-- Reubicar resenas de slugs viejos
WITH product_map AS (
  SELECT old_p.id AS old_id, new_p.id AS new_id
  FROM products old_p
  JOIN products new_p ON
    (
      old_p.slug IN (
        'xiaomi-redmi-airdots-s',
        'auriculares-xiaomi-redmi-airdots-s',
        'xiaomi-redmi-buds-4-lite'
      )
      AND new_p.slug = 'audifonos-xiaomi-redmi-buds-4-lite'
    )
    OR
    (
      old_p.slug IN (
        'aire-acondicionado-portatil-arctic-ice',
        'arctic-air-ice-jet',
        'camara-seguridad-bombillo-360'
      )
      AND new_p.slug = 'camara-seguridad-bombillo-360-wifi'
    )
)
UPDATE product_reviews pr
SET product_id = pm.new_id,
    updated_at = NOW()
FROM product_map pm
WHERE pr.product_id = pm.old_id;

-- Aprobar compras verificadas para catalogo actual
UPDATE product_reviews pr
SET is_approved = true,
    updated_at = NOW()
WHERE pr.is_verified_purchase = true
  AND pr.product_id IN (
    SELECT id
    FROM products
    WHERE slug IN (
      'airpods-pro-3',
      'audifonos-xiaomi-redmi-buds-4-lite',
      'camara-seguridad-bombillo-360-wifi',
      'smartwatch-ultra-series-pantalla-grande',
      'silla-gamer-premium-reposapies',
      'cepillo-electrico-5-en-1-secador-alisador',
      'air-fryer-freidora-10l-premium',
      'lampara-mata-zancudos-electrica',
      'aspiradora-inalambrica-de-mano',
      'combo-cargador-4-en-1-adaptadorcable',
      'corrector-de-postura',
      'depilador-facial-electrico-recargable'
    )
  );

COMMIT;



-- ============================================
-- Allshop / Vortixy - 03_runtime_stock.sql
-- Seed de stock operativo manual (panel privado + checkout)
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS catalog_runtime_state (
  product_slug VARCHAR(255) PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  total_stock INTEGER CHECK (total_stock IS NULL OR total_stock >= 0),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by VARCHAR(120),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_runtime_state_updated_at
  ON catalog_runtime_state(updated_at DESC);

WITH desired_stock AS (
  SELECT *
  FROM (
    VALUES
      ('airpods-pro-3', 60, '[{"name":"BLANCO","stock":60,"variation_id":null}]'::jsonb),
      ('audifonos-xiaomi-redmi-buds-4-lite', 323, '[{"name":"NEGRO","stock":198,"variation_id":1387309},{"name":"BLANCO","stock":125,"variation_id":1387310}]'::jsonb),
      ('silla-gamer-premium-reposapies', 640, '[{"name":"NEGRO ROJO","stock":120,"variation_id":1539198},{"name":"NEGRO AZUL","stock":0,"variation_id":1539199},{"name":"NEGRO","stock":121,"variation_id":1539202},{"name":"NEGRO BLANCO","stock":120,"variation_id":1539200},{"name":"NEGRO GRIS","stock":129,"variation_id":1539201},{"name":"ROSA","stock":150,"variation_id":1539203}]'::jsonb),
      ('air-fryer-freidora-10l-premium', 199, '[{"name":"ACERO INOXIDABLE/NEGRO","stock":199,"variation_id":null}]'::jsonb),
      ('smartwatch-ultra-series-pantalla-grande', 100, '[{"name":"NARANJA","stock":100,"variation_id":null}]'::jsonb),
      ('camara-seguridad-bombillo-360-wifi', 150, '[{"name":"E27 (ESTANDAR)","stock":150,"variation_id":null}]'::jsonb),
      ('cepillo-electrico-5-en-1-secador-alisador', 99, '[{"name":"NEGRO","stock":99,"variation_id":null}]'::jsonb),
      ('lampara-mata-zancudos-electrica', 300, '[{"name":"BLANCO","stock":300,"variation_id":null}]'::jsonb),
      ('aspiradora-inalambrica-de-mano', 99, '[{"name":"UNICO","stock":99,"variation_id":null}]'::jsonb),
      ('combo-cargador-4-en-1-adaptadorcable', 66, '[{"name":"UNICO","stock":66,"variation_id":null}]'::jsonb),
      ('corrector-de-postura', 288, '[{"name":"S","stock":45,"variation_id":1955346},{"name":"M","stock":46,"variation_id":1955347},{"name":"L","stock":48,"variation_id":1955348},{"name":"XL","stock":49,"variation_id":1955349},{"name":"XXL","stock":50,"variation_id":1955350},{"name":"XXXL","stock":50,"variation_id":1955351}]'::jsonb),
      ('depilador-facial-electrico-recargable', 95, '[{"name":"UNICO","stock":95,"variation_id":null}]'::jsonb)
  ) AS t(product_slug, total_stock, variants)
)
INSERT INTO catalog_runtime_state (product_slug, total_stock, variants, updated_by, updated_at)
SELECT ds.product_slug, ds.total_stock, ds.variants, 'catalog_sync', NOW()
FROM desired_stock ds
ON CONFLICT (product_slug) DO UPDATE SET
  total_stock = EXCLUDED.total_stock,
  variants = EXCLUDED.variants,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

COMMIT;
