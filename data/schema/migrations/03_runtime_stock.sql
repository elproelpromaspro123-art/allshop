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
