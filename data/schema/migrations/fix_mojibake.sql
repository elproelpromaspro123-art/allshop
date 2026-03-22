-- ============================================
-- Vortixy / Allshop - FIX MOJIBAKE (textos dañados)
-- Ejecutar en Supabase SQL Editor UNA sola vez
-- ============================================
-- Este script corrige textos con encoding doble UTF-8
-- (ejemplo: "CÃ³modos" → "Cómodos")
-- ============================================

-- Helper function to fix double-encoded UTF-8
CREATE OR REPLACE FUNCTION fix_mojibake(input TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  RETURN convert_from(convert_to(input, 'LATIN1'), 'UTF8');
EXCEPTION WHEN OTHERS THEN
  RETURN input;
END;
$$;

-- Fix products
UPDATE products SET
  name = fix_mojibake(name),
  description = fix_mojibake(description),
  meta_title = fix_mojibake(meta_title),
  meta_description = fix_mojibake(meta_description)
WHERE name ~ 'Ã' OR description ~ 'Ã' OR meta_title ~ 'Ã' OR meta_description ~ 'Ã';

-- Fix categories
UPDATE categories SET
  name = fix_mojibake(name),
  description = fix_mojibake(description)
WHERE name ~ 'Ã' OR description ~ 'Ã';

-- Fix product reviews
UPDATE product_reviews SET
  title = fix_mojibake(title),
  body = fix_mojibake(body),
  reviewer_name = fix_mojibake(reviewer_name)
WHERE title ~ 'Ã' OR body ~ 'Ã' OR reviewer_name ~ 'Ã';

-- Fix orders (customer names / notes)
UPDATE orders SET
  customer_name = fix_mojibake(customer_name),
  notes = fix_mojibake(notes)
WHERE customer_name ~ 'Ã' OR notes ~ 'Ã';

-- Cleanup helper
DROP FUNCTION IF EXISTS fix_mojibake(TEXT);
