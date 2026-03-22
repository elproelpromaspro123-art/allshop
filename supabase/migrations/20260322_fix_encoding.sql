-- ============================================================
-- Vortixy: Fix Corrupted Text Encoding
-- Fixes UTF-8 mojibake (double-encoded text) in Supabase
-- Copy and run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- STEP 1: Drop the unique index temporarily
DROP INDEX IF EXISTS idx_product_reviews_seed_unique;

-- STEP 2: Fix product_reviews table
DO $$
DECLARE
  r RECORD;
  new_title TEXT;
  new_body TEXT;
BEGIN
  FOR r IN
    SELECT id, title, body
    FROM product_reviews
    WHERE title LIKE '%Ã%' OR body LIKE '%Ã%'
  LOOP
    -- Fix title
    new_title := r.title;
    new_title := REPLACE(new_title, 'Ã¡', 'á');
    new_title := REPLACE(new_title, 'Ã©', 'é');
    new_title := REPLACE(new_title, 'Ã­', 'í');
    new_title := REPLACE(new_title, 'Ã³', 'ó');
    new_title := REPLACE(new_title, 'Ãº', 'ú');
    new_title := REPLACE(new_title, 'Ã±', 'ñ');
    new_title := REPLACE(new_title, 'Ã¼', 'ü');
    new_title := REPLACE(new_title, 'Ã¿', '¿');
    new_title := REPLACE(new_title, 'Ã¨', 'è');
    new_title := REPLACE(new_title, 'Ã²', 'ò');

    -- Fix body
    new_body := r.body;
    new_body := REPLACE(new_body, 'Ã¡', 'á');
    new_body := REPLACE(new_body, 'Ã©', 'é');
    new_body := REPLACE(new_body, 'Ã­', 'í');
    new_body := REPLACE(new_body, 'Ã³', 'ó');
    new_body := REPLACE(new_body, 'Ãº', 'ú');
    new_body := REPLACE(new_body, 'Ã±', 'ñ');
    new_body := REPLACE(new_body, 'Ã¼', 'ü');
    new_body := REPLACE(new_body, 'Ã¿', '¿');
    new_body := REPLACE(new_body, 'Ã¨', 'è');
    new_body := REPLACE(new_body, 'Ã²', 'ò');

    UPDATE product_reviews
    SET title = new_title, body = new_body
    WHERE id = r.id;
  END LOOP;
END $$;

-- STEP 3: Remove duplicates that were created by the text fix
DELETE FROM product_reviews a USING product_reviews b
WHERE a.ctid > b.ctid
  AND a.product_id = b.product_id
  AND COALESCE(a.reviewer_name, '') = COALESCE(b.reviewer_name, '')
  AND COALESCE(a.title, '') = COALESCE(b.title, '')
  AND MD5(COALESCE(a.body, '')) = MD5(COALESCE(b.body, ''));

-- STEP 4: Recreate the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_reviews_seed_unique
ON product_reviews (product_id, COALESCE(reviewer_name, ''), COALESCE(title, ''), MD5(COALESCE(body, '')));

-- STEP 5: Fix products table
DO $$
DECLARE
  r RECORD;
  new_name TEXT;
  new_description TEXT;
BEGIN
  FOR r IN
    SELECT id, name, description
    FROM products
    WHERE name LIKE '%Ã%' OR description LIKE '%Ã%'
  LOOP
    -- Fix name
    new_name := r.name;
    new_name := REPLACE(new_name, 'Ã¡', 'á');
    new_name := REPLACE(new_name, 'Ã©', 'é');
    new_name := REPLACE(new_name, 'Ã­', 'í');
    new_name := REPLACE(new_name, 'Ã³', 'ó');
    new_name := REPLACE(new_name, 'Ãº', 'ú');
    new_name := REPLACE(new_name, 'Ã±', 'ñ');
    new_name := REPLACE(new_name, 'Ã¼', 'ü');
    new_name := REPLACE(new_name, 'Ã¿', '¿');
    new_name := REPLACE(new_name, 'Ã¨', 'è');
    new_name := REPLACE(new_name, 'Ã²', 'ò');

    -- Fix description
    new_description := r.description;
    new_description := REPLACE(new_description, 'Ã¡', 'á');
    new_description := REPLACE(new_description, 'Ã©', 'é');
    new_description := REPLACE(new_description, 'Ã­', 'í');
    new_description := REPLACE(new_description, 'Ã³', 'ó');
    new_description := REPLACE(new_description, 'Ãº', 'ú');
    new_description := REPLACE(new_description, 'Ã±', 'ñ');
    new_description := REPLACE(new_description, 'Ã¼', 'ü');
    new_description := REPLACE(new_description, 'Ã¿', '¿');
    new_description := REPLACE(new_description, 'Ã¨', 'è');
    new_description := REPLACE(new_description, 'Ã²', 'ò');

    UPDATE products
    SET name = new_name, description = new_description
    WHERE id = r.id;
  END LOOP;
END $$;

-- STEP 6: Verify remaining corrupted texts (should return 0 if all fixed)
SELECT 'product_reviews.title' as table_column, COUNT(*) as still_corrupted
FROM product_reviews WHERE title LIKE '%Ã%'
UNION ALL
SELECT 'product_reviews.body', COUNT(*)
FROM product_reviews WHERE body LIKE '%Ã%'
UNION ALL
SELECT 'products.name', COUNT(*)
FROM products WHERE name LIKE '%Ã%'
UNION ALL
SELECT 'products.description', COUNT(*)
FROM products WHERE description LIKE '%Ã%';

-- STEP 7: Show summary
SELECT 'Fix completed!' as status;
