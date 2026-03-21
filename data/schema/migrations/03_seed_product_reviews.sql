-- ============================================
-- Allshop / Vortixy - 03_seed_product_reviews.sql
-- Reseñas realistas para productos (ratings variados: 3, 4, 5 estrellas)
-- ============================================

BEGIN;

-- AirPods Pro 3 (tecnologia)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Carolina Mejia', 5, 'Se escuchan muy bien', 'Los he usado para llamadas y trayectos largos. La cancelación de ruido se nota y el estuche carga rápido.', true, NOW() - INTERVAL '11 days'),
    ('Julian Pardo', 5, 'Cómodos para todo el día', 'Me gustaron porque no se sienten pesados y el audio espacial da una sensación más amplia al ver videos.', true, NOW() - INTERVAL '18 days'),
    ('Laura Rios', 5, 'Buen detalle para regalo', 'Los pedí para un regalo y llegaron bien presentados. La persona los usa a diario y está contenta con la batería.', true, NOW() - INTERVAL '25 days'),
    ('Mateo Herrera', 4, 'Buen sonido y buena autonomía', 'La conexión fue rápida y el sonido es limpio. Les doy 4 estrellas porque tuve que ajustar bien las almohadillas al principio.', true, NOW() - INTERVAL '7 days'),
    ('Natalia Cruz', 5, 'Cumplieron lo prometido', 'Los uso para estudiar y para entrenar. El aislamiento ayuda bastante y no he tenido problemas con el estuche.', true, NOW() - INTERVAL '14 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'airpods-pro-3';

-- Audifonos Xiaomi Redmi Buds 4 Lite (tecnologia)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Carlos Mendoza', 5, 'Excelente calidad de sonido', 'Los uso todos los días para el gimnasio y el sonido es increíble. La batería dura mucho y son muy cómodos.', true, NOW() - INTERVAL '15 days'),
    ('Andrea Ramírez', 5, 'Muy buenos para el precio', 'La verdad superaron mis expectativas. El Bluetooth se conecta rápido y no se escucha ruido.', true, NOW() - INTERVAL '22 days'),
    ('Julián Torres', 4, 'Buenos pero podrían ser mejores', 'El sonido es bueno pero me gustaría que tuvieran más graves. Por lo demás, cumplen su función.', true, NOW() - INTERVAL '8 days'),
    ('Valentina Gómez', 5, 'Perfectos para correr', 'No se caen, son ligeros y el sonido es nítido. Los recomiendo 100%.', true, NOW() - INTERVAL '30 days'),
    ('Andrés Felipe Díaz', 4, 'Buena compra', 'Llegaron rápido y funcionan bien. La caja es compacta y fácil de llevar.', true, NOW() - INTERVAL '12 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'audifonos-xiaomi-redmi-buds-4-lite';

-- Cámara de Seguridad Bombillo 360 WiFi (hogar)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Luis Fernando Pérez', 5, 'Excelente cámara para el hogar', 'La instalé en la habitación de mi bebé y puedo verlo desde el celular. La calidad de imagen es muy buena.', true, NOW() - INTERVAL '20 days'),
    ('María Camila Sánchez', 5, 'Fácil de instalar', 'Solo la enroscas en el bombillo y listo. La app es intuitiva y la conexión es estable.', true, NOW() - INTERVAL '35 days'),
    ('Roberto Gómez', 4, 'Buena relación calidad-precio', 'Por el precio está muy bien. La visión nocturna funciona pero podría ser más nítida.', true, NOW() - INTERVAL '10 days'),
    ('Patricia Morales', 5, 'Me siento más segura', 'La tengo en la sala y puedo verificar a mis mascotas cuando estoy fuera. El audio bidireccional es un plus.', true, NOW() - INTERVAL '18 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'camara-seguridad-bombillo-360-wifi';

-- Smartwatch Ultra Series Pantalla Grande (tecnologia)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Daniela Vargas', 5, 'Hermoso y funcional', 'La pantalla es grande y se ve genial. Las notificaciones llegan al instante y la batería dura 3 días.', true, NOW() - INTERVAL '25 days'),
    ('Sebastián Ortiz', 4, 'Buen smartwatch', 'Cumple con lo básico. El podómetro es preciso y las alarmas funcionan. La correa podría ser de mejor calidad.', true, NOW() - INTERVAL '14 days'),
    ('Mónica Restrepo', 5, 'Me encanta', 'Es mi primer smartwatch y estoy feliz. Lo uso para medir mis pasos y ver la hora sin sacar el celular.', true, NOW() - INTERVAL '40 days'),
    ('Jorge Alberto Ruiz', 3, 'Regular', 'La pantalla es buena pero la batería no dura tanto como esperaba. Hay que cargarlo cada 2 días.', true, NOW() - INTERVAL '5 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'smartwatch-ultra-series-pantalla-grande';

-- Silla Gamer Premium con Reposapiés (hogar)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Felipe Andrade', 5, 'La mejor inversión', 'Trabajo desde casa y esta silla cambió mi vida. El soporte lumbar es excelente y el reposapiés es un plus.', true, NOW() - INTERVAL '45 days'),
    ('Carolina Mejía', 5, 'Muy cómoda', 'Paso 8 horas diarias sentado y no me duele la espalda. El armado fue fácil y las instrucciones son claras.', true, NOW() - INTERVAL '28 days'),
    ('Óscar Hernández', 4, 'Buena silla gamer', 'Es cómoda y se ve genial. El único pero es que el cuero se calienta un poco en verano.', true, NOW() - INTERVAL '16 days'),
    ('Natalia Guerrero', 5, 'Recomendada', 'La compré para mi hijo y está encantado. La altura es ajustable y los reposabrazos son suaves.', true, NOW() - INTERVAL '60 days'),
    ('Miguel Ángel Castro', 4, 'Buena compra', 'La silla es robusta y cómoda. Le doy 4 estrellas porque el envío tardó más de lo esperado.', true, NOW() - INTERVAL '9 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'silla-gamer-premium-reposapies';

-- Cepillo Eléctrico 5 en 1 (belleza)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Isabella Moreno', 5, 'Práctico y versátil', 'Los accesorios son fáciles de cambiar y mi cabello queda suave. Lo uso 3 veces por semana.', true, NOW() - INTERVAL '33 days'),
    ('Laura Daniela Rojas', 4, 'Buen producto', 'Funciona bien pero hay que usar protector térmico. El calor es uniforme y no tira del cabello.', true, NOW() - INTERVAL '19 days'),
    ('Sandra Milena Torres', 5, 'Me ahorra tiempo', 'Antes tardaba 40 minutos en arreglarme el cabello, ahora solo 15. Los rodillos onduladores son mis favoritos.', true, NOW() - INTERVAL '50 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'cepillo-electrico-5-en-1-secador-alisador';

-- Air Fryer Freidora 10L Premium (cocina)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Gloria Elena Vásquez', 5, 'La mejor compra del año', 'Cocino para 6 personas y todo cabe perfectamente. Las papas quedan crujientes sin aceite.', true, NOW() - INTERVAL '55 days'),
    ('Ricardo Alberto Fuentes', 5, 'Excelente freidora', 'La uso todos los días. Es fácil de limpiar y los resultados son consistentes.', true, NOW() - INTERVAL '42 days'),
    ('Ana María Beltrán', 4, 'Muy buena pero grande', 'Funciona perfecto pero ocupa bastante espacio en la encimera. Si tienes cocina pequeña, tenlo en cuenta.', true, NOW() - INTERVAL '23 days'),
    ('Pedro José Navarro', 5, 'Calidad premium', 'Los materiales son resistentes y los controles son intuitivos. Vale cada peso.', true, NOW() - INTERVAL '38 days'),
    ('Carmen Elisa Ramos', 3, 'Buena pero ruidosa', 'La comida queda deliciosa pero hace más ruido de lo que esperaba. No es grave pero se nota.', true, NOW() - INTERVAL '7 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'air-fryer-freidora-10l-premium';

-- Lámpara Mata Zancudos Eléctrica (hogar)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Héctor Julio Ramírez', 5, 'Funciona de verdad', 'La tengo en el cuarto de mis hijos y ya no escuchamos zancudos en la noche. Muy efectiva.', true, NOW() - INTERVAL '27 days'),
    ('Beatriz Elena Gómez', 4, 'Buena compra', 'Atrapa muchos insectos. La luz UV no es molesta y el consumo es bajo.', true, NOW() - INTERVAL '11 days'),
    ('William Alberto Díaz', 5, 'Recomendada', 'Vivo cerca a una zona húmeda y los zancudos eran un problema. Esta lámpara lo solucionó.', true, NOW() - INTERVAL '48 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'lampara-mata-zancudos-electrica';

-- Aspiradora Inalámbrica de Mano 3 en 1 (hogar)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Diana Marcela Ortiz', 5, 'Perfecta para el carro', 'La uso para limpiar las migajas de los niños y el polvo del tablero. La succión es buena.', true, NOW() - INTERVAL '31 days'),
    ('Raúl Ernesto Mendoza', 4, 'Buena aspiradora', 'Es ligera y fácil de usar. La batería dura unos 20 minutos, suficiente para limpiezas rápidas.', true, NOW() - INTERVAL '17 days'),
    ('Lucía Fernanda Castro', 5, 'Muy práctica', 'Los accesorios son útiles para llegar a rincones difíciles. Se carga rápido.', true, NOW() - INTERVAL '44 days'),
    ('Germán Alberto Rojas', 3, 'Cumple pero podría mejorar', 'La succión es decente pero el depósito es pequeño. Hay que vaciarlo seguido.', true, NOW() - INTERVAL '6 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'aspiradora-inalambrica-de-mano';

-- Combo Cargador 4 en 1 (tecnología)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Édgar Mauricio Silva', 5, 'Muy útil', 'Tengo iPhone, Android y tablet. Con este combo los cargo todos sin problema. La carga es rápida.', true, NOW() - INTERVAL '36 days'),
    ('Silvia Patricia Vega', 4, 'Buen producto', 'El cable es resistente y los conectores encajan bien. Me gustaría que fuera un poco más largo.', true, NOW() - INTERVAL '21 days'),
    ('Javier Eduardo Peña', 5, 'Excelente compra', 'Lo llevo siempre en la maleta. Es compacto y me saca de apuros cuando viajo.', true, NOW() - INTERVAL '52 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'combo-cargador-4-en-1-adaptadorcable';

-- Corrector de Postura (fitness)
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT 
  p.id,
  v.reviewer_name,
  v.rating,
  v.title,
  v.body,
  v.is_verified_purchase,
  true,
  v.created_at
FROM products p
CROSS JOIN (
  VALUES
    ('Claudia Marcela Herrera', 5, 'Me ayudó con el dolor', 'Trabajo en oficina y siempre terminaba con dolor de espalda. Lo uso 2 horas al día y he notado mejoría.', true, NOW() - INTERVAL '29 days'),
    ('Alberto José Molina', 4, 'Buen corrector', 'El material es transpirable y las correas son ajustables. Hay que ser constante para ver resultados.', true, NOW() - INTERVAL '13 days'),
    ('Martha Lucía Delgado', 5, 'Recomendado', 'Mi hija lo usa para estudiar y ha mejorado su postura. Es discreto y se puede usar bajo la ropa.', true, NOW() - INTERVAL '47 days'),
    ('René Carlos Vargas', 3, 'Funciona pero es incómodo', 'Corrige la postura pero después de una hora se siente apretado. Quizás necesito acostumbrarme.', true, NOW() - INTERVAL '4 days')
) AS v(reviewer_name, rating, title, body, is_verified_purchase, created_at)
WHERE p.slug = 'corrector-de-postura';

COMMIT;
