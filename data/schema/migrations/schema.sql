-- ============================================
-- Vortixy - Schema de Base de Datos (Supabase)
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE products (
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

-- ============================================
-- TABLA: orders
-- ============================================
CREATE TABLE orders (
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

-- ============================================
-- TABLA: product_reviews
-- ============================================
CREATE TABLE product_reviews (
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

-- ============================================
-- TABLA: fulfillment_logs
-- ============================================
CREATE TABLE fulfillment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  payload JSONB,
  response JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: blocked_ips
-- ============================================
CREATE TABLE blocked_ips (
  ip VARCHAR(45) PRIMARY KEY,
  duration VARCHAR(20) NOT NULL DEFAULT 'permanent',
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- TABLA: catalog_runtime_state (stock operativo manual)
-- ============================================
CREATE TABLE catalog_runtime_state (
  product_slug VARCHAR(255) PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  total_stock INTEGER CHECK (total_stock IS NULL OR total_stock >= 0),
  variants JSONB NOT NULL DEFAULT '[]',
  updated_by VARCHAR(120),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
DROP INDEX IF EXISTS idx_orders_payment;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;

ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS provider_api_url TEXT;

CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_public
  ON product_reviews(product_id, created_at DESC)
  WHERE is_approved = true AND is_verified_purchase = true;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE UNIQUE INDEX idx_orders_payment_unique ON orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_blocked_ips_expires ON blocked_ips(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX idx_catalog_runtime_state_updated_at ON catalog_runtime_state(updated_at DESC);

-- ============================================
-- FUNCIONES: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_runtime_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Product reviews are viewable by everyone" ON product_reviews;
DROP POLICY IF EXISTS "Product reviews blocked for client roles" ON product_reviews;
DROP POLICY IF EXISTS "Orders can be created by anyone" ON orders;
DROP POLICY IF EXISTS "Orders viewable by customer email" ON orders;
DROP POLICY IF EXISTS "Orders blocked for client roles" ON orders;
DROP POLICY IF EXISTS "Fulfillment logs blocked for client roles" ON fulfillment_logs;
DROP POLICY IF EXISTS "Catalog runtime blocked for client roles" ON catalog_runtime_state;

-- Políticas públicas de lectura para categorías y productos
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "Product reviews are viewable by everyone"
  ON product_reviews FOR SELECT
  USING (is_approved = true AND is_verified_purchase = true);

-- ============================================
-- DATOS INICIALES (Seed)
-- ============================================
INSERT INTO categories (name, slug, description, icon, color) VALUES
  ('Cocina', 'cocina', 'Los mejores productos para tu cocina', 'ChefHat', '#F97316'),
  ('Tecnología', 'tecnologia', 'Gadgets y accesorios tecnológicos', 'Smartphone', '#3B82F6'),
  ('Hogar', 'hogar', 'Todo para tu hogar', 'Home', '#10B981'),
  ('Belleza', 'belleza', 'Cuidado personal y belleza', 'Sparkles', '#EC4899'),
  ('Fitness', 'fitness', 'Equipos y accesorios deportivos', 'Dumbbell', '#8B5CF6');
