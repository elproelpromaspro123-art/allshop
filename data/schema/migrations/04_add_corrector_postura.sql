-- ============================================
-- Allshop / Vortixy - 04_add_corrector_postura.sql
-- Alta puntual del producto "Corrector De Postura Ajustable"
-- Ejecutar despues de 01_schema.sql y con categorias creadas
-- ============================================

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost INTEGER;

CREATE TABLE IF NOT EXISTS catalog_runtime_state (
  product_slug VARCHAR(255) PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  total_stock INTEGER CHECK (total_stock IS NULL OR total_stock >= 0),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by VARCHAR(120),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, slug, description, image_url, icon, color)
VALUES
  (
    'Fitness',
    'fitness',
    'Equipamiento esencial para tu bienestar fisico y recuperacion muscular',
    '/categories/fitness.jpg',
    'Dumbbell',
    '#8B5CF6'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

INSERT INTO products (
  name,
  slug,
  description,
  price,
  compare_at_price,
  category_id,
  images,
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
  'Corrector De Postura Ajustable',
  'corrector-de-postura',
  'Corrector de postura ajustable y transpirable para soporte diario en espalda y hombros. Ideal para oficina, estudio y rutinas de uso prolongado.',
  39000,
  49900,
  c.id,
  ARRAY[
    '/productos/corrector-de-postura/corrector-postura-1.png',
    '/productos/corrector-de-postura/corrector-postura-2.png',
    '/productos/corrector-de-postura/corrector-postura-3.png',
    '/productos/corrector-de-postura/corrector-postura-4.jpg',
    '/productos/corrector-de-postura/corrector-postura-5.jpg',
    '/productos/corrector-de-postura/corrector-postura-6.jpg'
  ]::text[],
  '[{"name":"Talla","options":["S","M","L","XL","XXL","XXXL"]}]'::jsonb,
  'nacional',
  false,
  null,
  null,
  true,
  true,
  false,
  'Corrector de Postura Ajustable',
  'Corrector de postura ajustable con tallas S a XXXL para uso diario y soporte comodo.',
  NOW()
FROM categories c
WHERE c.slug = 'fitness'
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
  shipping_cost = EXCLUDED.shipping_cost,
  provider_api_url = EXCLUDED.provider_api_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  is_bestseller = EXCLUDED.is_bestseller,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();

INSERT INTO catalog_runtime_state (
  product_slug,
  total_stock,
  variants,
  updated_by,
  updated_at
)
VALUES (
  'corrector-de-postura',
  288,
  '[{"name":"S","stock":45,"variation_id":1955346},{"name":"M","stock":46,"variation_id":1955347},{"name":"L","stock":48,"variation_id":1955348},{"name":"XL","stock":49,"variation_id":1955349},{"name":"XXL","stock":50,"variation_id":1955350},{"name":"XXXL","stock":50,"variation_id":1955351}]'::jsonb,
  'catalog_sync',
  NOW()
)
ON CONFLICT (product_slug) DO UPDATE SET
  total_stock = EXCLUDED.total_stock,
  variants = EXCLUDED.variants,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

COMMIT;
