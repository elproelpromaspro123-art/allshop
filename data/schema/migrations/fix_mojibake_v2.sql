-- 1. Drop the conflicting index
DROP INDEX IF EXISTS idx_product_reviews_seed_unique;

-- 2. Fix mojibake
UPDATE product_reviews SET
  reviewer_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    reviewer_name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
  title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(title, ''),
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
  body = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    body,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE reviewer_name ~ 'Ã' OR title ~ 'Ã' OR body ~ 'Ã';

UPDATE products SET
  name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE name ~ 'Ã' OR description ~ 'Ã';

UPDATE categories SET
  name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(description, ''),
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE name ~ 'Ã' OR description ~ 'Ã';

UPDATE orders SET
  customer_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    customer_name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE customer_name ~ 'Ã';

-- 3. Remove duplicate seed reviews created by mojibake fix
--    Keep only one row per (product_id, reviewer_name, title, left(body,100))
DELETE FROM product_reviews
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY product_id, COALESCE(reviewer_name, ''), COALESCE(title, ''), left(body, 100)
             ORDER BY created_at ASC
           ) AS rn
    FROM product_reviews
    WHERE order_id IS NULL AND is_verified_purchase = true
  ) dupes
  WHERE rn > 1
);

-- 4. Recreate index with compatible definition
CREATE UNIQUE INDEX idx_product_reviews_seed_unique
  ON product_reviews (product_id, COALESCE(reviewer_name, ''), COALESCE(title, ''), left(body, 100))
  WHERE order_id IS NULL AND is_verified_purchase = true;
