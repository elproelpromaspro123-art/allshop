-- ============================================
-- Allshop / Vortixy - 02_seed_catalog.sql
-- Categorias + catalogo canonico (12 productos)
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
  SELECT *
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
    variants,
    stock_location,
    free_shipping,
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
    d.variants,
    'nacional',
    true,
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
    variants = EXCLUDED.variants,
    stock_location = EXCLUDED.stock_location,
    free_shipping = EXCLUDED.free_shipping,
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


