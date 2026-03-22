-- 1. Drop the conflicting index
DROP INDEX IF EXISTS idx_product_reviews_seed_unique;

-- 2. Fix mojibake (lowercase accents)
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

-- 2b. Fix mojibake (UPPERCASE accents — bytes are control chars, need chr())
UPDATE product_reviews SET
  reviewer_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    reviewer_name,
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ'),
  title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(title, ''),
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ'),
  body = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    body,
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ')
WHERE reviewer_name ~ chr(195) OR title ~ chr(195) OR body ~ chr(195);

UPDATE products SET
  name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE name ~ 'Ã' OR description ~ 'Ã';

UPDATE products SET
  name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    description,
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ')
WHERE name ~ chr(195) OR description ~ chr(195);

UPDATE categories SET
  name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(description, ''),
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE name ~ 'Ã' OR description ~ 'Ã';

UPDATE categories SET
  name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    COALESCE(description, ''),
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ')
WHERE name ~ chr(195) OR description ~ chr(195);

UPDATE orders SET
  customer_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    customer_name,
    'Ã¡', 'á'), 'Ã©', 'é'), 'Ã­', 'í'), 'Ã³', 'ó'), 'Ãº', 'ú'), 'Ã±', 'ñ')
WHERE customer_name ~ 'Ã';

UPDATE orders SET
  customer_name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    customer_name,
    chr(195)||chr(129), 'Á'), chr(195)||chr(137), 'É'), chr(195)||chr(141), 'Í'),
    chr(195)||chr(147), 'Ó'), chr(195)||chr(154), 'Ú'), chr(195)||chr(145), 'Ñ')
WHERE customer_name ~ chr(195);

-- 3. Remove duplicate seed reviews created by mojibake fix
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
