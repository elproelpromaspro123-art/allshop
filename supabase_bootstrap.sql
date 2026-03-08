-- ============================================
-- Allshop / Vortixy - Full Supabase Bootstrap
-- Run this whole script in Supabase SQL Editor
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

-- Compatibility alters for old schemas
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_unique ON orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_runtime_state_updated_at
  ON catalog_runtime_state(updated_at DESC);

-- ============================================
-- Triggers for updated_at
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
-- RLS and policies
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_runtime_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Product reviews are viewable by everyone" ON product_reviews;
DROP POLICY IF EXISTS "Product reviews blocked for client roles" ON product_reviews;
DROP POLICY IF EXISTS "Orders blocked for client roles" ON orders;
DROP POLICY IF EXISTS "Fulfillment logs blocked for client roles" ON fulfillment_logs;
DROP POLICY IF EXISTS "Blocked IPs blocked for client roles" ON blocked_ips;
DROP POLICY IF EXISTS "Catalog runtime blocked for client roles" ON catalog_runtime_state;

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

-- ============================================
-- Seed: categories
-- ============================================
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

-- ============================================
-- Seed: products
-- Includes provider_api_url so checkout can map Dropi immediately
-- ============================================
INSERT INTO products (
  name, slug, description, price, compare_at_price, category_id,
  images, variants, stock_location, free_shipping, provider_api_url,
  is_featured, is_active, is_bestseller, meta_title, meta_description
)
VALUES
(
  'Auriculares Xiaomi Redmi Airdots S TWS Bluetooth 5.0',
  'auriculares-xiaomi-redmi-airdots-s',
  'Experimenta la verdadera libertad inalambrica con los Xiaomi Redmi Airdots S. Bluetooth 5.0, diseno ultra ligero y autonomia extendida.',
  54900, 104875,
  (SELECT id FROM categories WHERE slug = 'tecnologia'),
  ARRAY[
    '/productos/imagenes del producto 1 (Xiaomi Redmi Airdots Manos Libres Blueto)/17019755381701975538audifono1.png',
    '/productos/imagenes del producto 1 (Xiaomi Redmi Airdots Manos Libres Blueto)/17019755381701975538audifono2.png'
  ],
  '[{"name":"Color","options":["Negro"]}]'::jsonb,
  'nacional', true,
  'dropi://supplier_id=32016&product_id=242026&warehouse_id=32016',
  true, true, true,
  'Xiaomi Redmi Airdots S | Audifonos Bluetooth Originales',
  'Auriculares Xiaomi Redmi Airdots S con Bluetooth 5.0, sonido TWS y bateria de larga duracion.'
),
(
  'Silla Gamer Ergonomica Premium con Reposapies',
  'silla-gamer-premium-reposapies',
  'Silla gamer ergonomica con soporte lumbar, cojin cervical y reposapies extensible. Reclinable y robusta.',
  549900, 899900,
  (SELECT id FROM categories WHERE slug = 'hogar'),
  ARRAY[
    '/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)/Negro rojo.jpeg',
    '/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)/Negro con gris.jpeg',
    '/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)/Color negro.jpeg',
    '/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)/Negro con blanco.jpeg',
    '/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)/Negro con gris (segunda imagen de referencia).jpeg',
    '/productos/imagenes del producto 2 (Silla Gamer Con Reposapies)/Rosa.jpeg'
  ],
  '[{"name":"Color","options":["Negro Rojo","Negro Azul","Negro","Negro Blanco","Negro Gris","Rosa"]}]'::jsonb,
  'nacional', true,
  'dropi://supplier_id=29544&product_id=1839552&warehouse_id=29544',
  true, true, true,
  'Silla Gamer Premium con Reposapies | Comodidad Extrema',
  'Silla ergonomica reclinable con reposapies y cojines lumbar/cervical.'
),
(
  'Air Fryer Freidora de Aire 10L Premium con Ventana',
  'air-fryer-freidora-10l-premium',
  'Freidora de aire de 10 litros con ventana frontal para monitoreo y coccion uniforme.',
  349900, 599900,
  (SELECT id FROM categories WHERE slug = 'cocina'),
  ARRAY[
    '/productos/imagenes del producto 3 (Freidora 10l Premium)/1757706558D_NQ_NP_620013-MCO89672231768_082025-O.webp',
    '/productos/imagenes del producto 3 (Freidora 10l Premium)/1757706558D_NQ_NP_723096-MCO89672092094_082025-O.webp',
    '/productos/imagenes del producto 3 (Freidora 10l Premium)/1757706558D_NQ_NP_793140-MCO89672330972_082025-O.webp',
    '/productos/imagenes del producto 3 (Freidora 10l Premium)/1757706558D_NQ_NP_822739-MCO89672072432_082025-O.webp'
  ],
  '[{"name":"Color","options":["Acero Inoxidable/Negro"]}]'::jsonb,
  'nacional', true,
  'dropi://supplier_id=45331&product_id=710577&warehouse_id=45331',
  true, true, true,
  'Freidora de Aire 10L Premium | Con Ventana de Visualizacion',
  'Air Fryer XL de 10 litros con ventana frontal y acero inoxidable.'
),
(
  'Smartwatch Ultra Series - Pantalla Grande Tactil',
  'smartwatch-ultra-series-pantalla-grande',
  'Reloj inteligente con pantalla tactil grande, monitoreo de actividad y diseno moderno.',
  189900, 299900,
  (SELECT id FROM categories WHERE slug = 'tecnologia'),
  ARRAY[
    '/productos/imagenes del producto 4 (Reloj Inteligente Pantalla Grande Tactil)/ChatGPT_Image_3_mar_2026__11_02_54_p.m.-removebg-preview.png',
    '/productos/imagenes del producto 4 (Reloj Inteligente Pantalla Grande Tactil)/177007082533.png',
    '/productos/imagenes del producto 4 (Reloj Inteligente Pantalla Grande Tactil)/177007082534.png'
  ],
  '[{"name":"Color Correa","options":["Naranja"]}]'::jsonb,
  'nacional', true,
  'dropi://supplier_id=192984&product_id=2073403&warehouse_id=192984',
  true, true, false,
  'Smartwatch Ultra Series | Pantalla Tactil y Diseno Moderno',
  'Reloj inteligente con pantalla grande, modos deportivos y notificaciones.'
),
(
  'Aire Acondicionado Portatil Arctic Air Ice Jet',
  'aire-acondicionado-portatil-arctic-ice',
  'Enfriador portatil para espacios personales con flujo de aire direccionado.',
  159900, 249900,
  (SELECT id FROM categories WHERE slug = 'hogar'),
  ARRAY[
    '/productos/imagenes del producto 5 (Arctic Air Ice Jet Enfriador Portatil A)/177128281325.png',
    '/productos/imagenes del producto 5 (Arctic Air Ice Jet Enfriador Portatil A)/177128281327.png',
    '/productos/imagenes del producto 5 (Arctic Air Ice Jet Enfriador Portatil A)/177128281426.png'
  ],
  '[{"name":"Color","options":["Blanco/Gris"]}]'::jsonb,
  'nacional', true,
  'dropi://supplier_id=192984&product_id=2085987&warehouse_id=192984',
  true, true, false,
  'Enfriador Portatil Arctic Air Ice Jet | Solucion al Calor',
  'Aire portatil compacto para refrescar tu espacio personal.'
),
(
  'Cepillo Electrico 5 En 1 Secador Alisador Ondulador',
  'cepillo-electrico-5-en-1-secador-alisador',
  'Herramienta multifuncional para secar, alisar, ondular y dar volumen con accesorios intercambiables.',
  129900, 209900,
  (SELECT id FROM categories WHERE slug = 'belleza'),
  ARRAY[
    '/productos/imagenes del producto 6 (Cepillo Electrico 5 En 1 Secador Alisado)/1764262735Cepillo secador 5 en 1.png',
    '/productos/imagenes del producto 6 (Cepillo Electrico 5 En 1 Secador Alisado)/1764262735Cepillo secador 5 en 1 (1).png',
    '/productos/imagenes del producto 6 (Cepillo Electrico 5 En 1 Secador Alisado)/1764262735Cepillo secador 5 en 1 (2).png',
    '/productos/imagenes del producto 6 (Cepillo Electrico 5 En 1 Secador Alisado)/1764262734Cepillo secador 5 en 1 (3).png'
  ],
  '[{"name":"Color","options":["Negro"]}]'::jsonb,
  'nacional', true,
  'dropi://supplier_id=106656&product_id=570202&warehouse_id=106656',
  true, true, false,
  'Cepillo Electrico 5 En 1 | Secador, Alisador y Ondulador',
  'Cepillo de aire caliente 5 en 1 con accesorios y 3 niveles de temperatura.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category_id = EXCLUDED.category_id,
  images = EXCLUDED.images,
  variants = EXCLUDED.variants,
  stock_location = EXCLUDED.stock_location,
  free_shipping = EXCLUDED.free_shipping,
  provider_api_url = EXCLUDED.provider_api_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  is_bestseller = EXCLUDED.is_bestseller,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();

COMMIT;
