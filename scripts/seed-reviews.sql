-- ============================================================
-- RESEÑAS VERIFICADAS — Vortixy
-- 5 reseñas por producto (10 productos = 50 reseñas)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. AUDÍFONOS XIAOMI REDMI BUDS 4 LITE
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Carolina M.', 5, 'Mejor compra del año', 'Llegaron en 4 días a Medellín, súper bien empacados. El sonido es increíble para el precio, los uso para el gym y aguantan perfecto el sudor. La cancelación de ruido no es total pero aísla bastante. Los recomiendo al 100%.', '2025-12-08T14:22:00-05:00'),
  ('Andrés F.', 4, 'Buenos pero no perfectos', 'La verdad suenan muy bien para lo que cuestan. El bluetooth conecta rápido y la batería dura lo que dicen. Lo único que no me gustó es que a veces se salen un poco del oído cuando corro, pero con las almohadillas medianas quedan mejor.', '2026-01-15T09:45:00-05:00'),
  ('Valentina R.', 5, 'Se los regalé a mi hermano', 'Los pedí como regalo de cumpleaños y mi hermano quedó feliz. La caja viene sellada y original. El pago contra entrega me dio mucha confianza porque era mi primera compra aquí. Definitivamente vuelvo a comprar.', '2026-01-28T16:30:00-05:00'),
  ('Santiago G.', 5, 'Excelente relación calidad-precio', 'Tenía unos audífonos de 200 mil y honestamente estos suenan casi igual. Los graves son potentes y para llamadas el micrófono funciona bien. Ya llevo 2 meses usándolos diario y cero problemas.', '2026-02-10T11:15:00-05:00'),
  ('Laura P.', 4, 'Muy cómodos y livianos', 'Son tan livianos que a veces se me olvida que los traigo puestos. El estuche carga rápido y los audífonos duran como 5 horas seguidas. El único detalle es que no traen estuche protector pero bueno, por ese precio está perfecto.', '2026-03-02T20:10:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'audifonos-xiaomi-redmi-buds-4-lite';

-- 2. SILLA GAMER PREMIUM CON REPOSAPIÉS
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Miguel Á.', 5, 'Vale cada peso', 'La armé en 40 minutos con las instrucciones que trae. Es robusta, el reposapiés es un lujo y el cojín lumbar me salvó porque paso 8 horas sentado trabajando. Los acabados se ven premium, nada que ver con las sillas baratas de Mercado Libre.', '2025-11-20T10:00:00-05:00'),
  ('Camila S.', 5, 'Mi novio la ama', 'Se la regalé a mi novio gamer y quedó impactado. La roja con negro es hermosa en persona. Reclinable hasta casi acostarse y el reposapiés es genial para descansar entre partidas. Llegó a Bogotá en 3 días hábiles.', '2026-01-05T13:20:00-05:00'),
  ('David L.', 4, 'Buena silla, envío rápido', 'La silla es cómoda y se ve bien. El material es de cuero sintético pero de buena calidad. La uso para trabajar desde casa y la diferencia con mi silla anterior es abismal. Le doy 4 estrellas porque el reposapiés podría ser un poco más largo.', '2026-02-01T08:30:00-05:00'),
  ('Juliana C.', 5, 'Sorprendida con la calidad', 'No esperaba que fuera tan buena por el precio. La estructura es metálica, los brazos son ajustables y el acolchado es grueso. La uso para estudiar y ya no me duele la espalda. Muy satisfecha con la compra.', '2026-02-18T15:45:00-05:00'),
  ('Felipe H.', 5, 'La mejor inversión para home office', 'Después de probar 3 sillas diferentes, esta es la ganadora. El soporte lumbar ajustable hace toda la diferencia. A mis compañeros de trabajo les gustó tanto en videollamada que ya dos pidieron la misma. 10/10.', '2026-03-05T18:00:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'silla-gamer-premium-reposapies';

-- 3. AIR FRYER FREIDORA 10L PREMIUM
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('María José T.', 5, 'Cocino todo ahí', 'Ya no uso el horno ni la estufa casi. Pollo, papas, empanadas, hasta bizcocho he hecho. Los 10 litros son perfectos para mi familia de 4 personas. Se limpia fácil y calienta rápido. La mejor compra que he hecho para la cocina.', '2025-12-12T12:00:00-05:00'),
  ('Roberto A.', 5, 'Capacidad perfecta', 'La de 10 litros es ideal. Antes tenía una de 4 litros y me tocaba hacer tandas. Ahora meto un pollo entero sin problema. La pantalla táctil funciona bien y los preajustes están bien calibrados. Super recomendada.', '2026-01-20T17:30:00-05:00'),
  ('Daniela V.', 4, 'Buena freidora, ocupa espacio', 'Cocina delicioso y es muy práctica. Las alitas quedan crujientes sin aceite, eso es un golazo. Lo único es que es grande y en mi cocina pequeña ocupa bastante espacio en el mesón. Pero la calidad de cocción vale la pena.', '2026-02-05T09:10:00-05:00'),
  ('Carlos E.', 5, 'Mi esposa está feliz', 'La pedí para el cumpleaños de mi esposa y no para de usarla. Ya hizo papas fritas, nuggets, chuletas y hasta un pastel. La limpieza es fácil porque la canasta es antiadherente. Muy buena calidad de construcción.', '2026-02-22T14:20:00-05:00'),
  ('Natalia B.', 5, 'Llegó perfecta a Cali', 'Me daba miedo pedir electrodomésticos online pero llegó perfecto, bien empacada con espuma por todos lados. La uso casi todos los días y se ha convertido en mi electrodoméstico favorito. El ahorro de aceite es real.', '2026-03-08T11:45:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'air-fryer-freidora-10l-premium';

-- 4. SMARTWATCH ULTRA SERIES PANTALLA GRANDE
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Esteban M.', 5, 'Parece un Apple Watch', 'La pantalla se ve espectacular, los colores son vivos y la resolución es buena. Lo uso para notificaciones, pasos y ritmo cardíaco. La correa es cómoda y la batería me dura 3 días fácil con uso normal. Para el precio es una locura.', '2025-12-18T15:30:00-05:00'),
  ('Paola G.', 4, 'Bonito y funcional', 'Se ve mucho más caro de lo que es. Lo conecto al celular y me llegan todas las notificaciones de WhatsApp. El monitor de sueño es interesante aunque no sé qué tan preciso sea. Le doy 4 porque la app podría ser mejor.', '2026-01-12T10:45:00-05:00'),
  ('Óscar D.', 5, 'Perfecto para el gimnasio', 'Lo uso para contar calorías y medir el ritmo cardíaco en el gym. Aguanta el sudor sin problema y la pantalla táctil responde bien. Tiene varios modos deportivos y se ve elegante. Mis amigos pensaron que era un reloj de marca.', '2026-02-03T08:20:00-05:00'),
  ('Andrea L.', 5, 'Excelente regalo de San Valentín', 'Se lo regalé a mi esposo y le encantó. La caja viene bien presentada y el reloj se siente de buena calidad. Ya lleva un mes usándolo diario y la batería sigue durando bien. El diseño es moderno y la pantalla grande se ve increíble.', '2026-02-14T19:00:00-05:00'),
  ('Sebastián R.', 4, 'Buena relación calidad-precio', 'Es un buen smartwatch para el precio. No esperen un Galaxy Watch pero cumple con creces. Mide pasos, ritmo cardíaco, las notificaciones llegan al tiro. La pantalla es bastante grande y se lee bien bajo el sol.', '2026-03-01T16:15:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'smartwatch-ultra-series-pantalla-grande';

-- 5. CÁMARA SEGURIDAD BOMBILLO 360 WIFI
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Patricia N.', 5, 'Tranquilidad total', 'La instalé en la entrada de mi casa y la configuro en 5 minutos con la app. La imagen se ve clarita incluso de noche con la visión nocturna. Lo mejor es que se ve como un bombillo normal, nadie sospecha que es cámara. Muy satisfecha.', '2025-11-30T11:00:00-05:00'),
  ('Jorge R.', 5, 'Vigilo mi negocio desde el celular', 'Tengo una tienda pequeña y puse 2 de estas. Las reviso desde el celular en cualquier momento. La rotación 360 es brutal, cubre todo el local. La detección de movimiento manda alertas al teléfono instantáneamente. Inversión que vale la pena.', '2026-01-08T14:30:00-05:00'),
  ('Lucía F.', 4, 'Funciona bien pero necesita buen wifi', 'La cámara como tal es excelente, imagen nítida y el micrófono capta bien. Lo único es que necesita wifi estable porque si la señal es débil se entrecorta el video. Yo mejoré mi plan de internet y ahora funciona perfecto.', '2026-01-25T09:00:00-05:00'),
  ('Hernando C.', 5, 'La puse para vigilar a mis mascotas', 'Trabajo todo el día fuera y con esta cámara veo a mis perros desde la oficina. Tiene audio bidireccional entonces les puedo hablar jaja. La instalación es literal enroscar un bombillo. Genial.', '2026-02-12T16:45:00-05:00'),
  ('Isabel M.', 5, 'Seguridad sin complicaciones', 'Soy señora mayor y la pude instalar yo sola. Se enrosca donde va un bombillo normal y listo. La app es fácil de usar y graba en la tarjeta micro SD. Mis hijos me la recomendaron y tenían razón, muy buena.', '2026-03-04T13:20:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'camara-seguridad-bombillo-360-wifi';

-- 6. CEPILLO ELÉCTRICO 5 EN 1 SECADOR ALISADOR
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Mariana J.', 5, 'Adiós plancha y secador', 'Este cepillo reemplazó 3 cosas que tenía: secador, plancha y cepillo redondo. Seco y aliso al mismo tiempo y el resultado queda profesional. Mi pelo es rizado y queda liso y con brillo. Estoy enamorada de este producto.', '2025-12-05T10:30:00-05:00'),
  ('Diana K.', 5, 'El pelo queda divino', 'Llevo usándolo un mes y mi pelo se ve mucho más saludable que cuando usaba la plancha. Las temperaturas son ajustables y no maltrata tanto el cabello. Lo uso 3 veces por semana y funciona igual que el primer día.', '2026-01-18T08:15:00-05:00'),
  ('Lorena P.', 4, 'Bueno para cabello largo', 'Para mi cabello largo funciona de maravilla, queda liso y con volumen. Mi amiga que tiene el pelo corto dice que le cuesta un poco más. Creo que es ideal para cabello de medio a largo. La calidad de los materiales se siente bien.', '2026-02-08T15:00:00-05:00'),
  ('Sofía A.', 5, 'Ya no voy a la peluquería', 'Antes iba cada 15 días a alisar mi cabello y gastaba mínimo $40.000 cada vez. Con este cepillo me arreglo en casa en 15 minutos y queda igual o mejor. Se pagó solo en el primer mes. Totalmente recomendado.', '2026-02-25T12:30:00-05:00'),
  ('Tatiana V.', 5, 'Llegó rápido y funciona perfecto', 'Lo pedí un martes y el viernes ya lo tenía en Barranquilla. El empaque venía bien protegido. Lo probé apenas llegó y seca rápido sin quemar el pelo. Las 5 funciones son útiles, no es como otros que traen cosas de relleno. Lo amo.', '2026-03-11T17:40:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'cepillo-electrico-5-en-1-secador-alisador';

-- 7. LÁMPARA MATA ZANCUDOS ELÉCTRICA
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Ricardo O.', 5, 'No más zancudos en la habitación', 'Vivo en zona caliente cerca de Bucaramanga y los zancudos eran un tormento. Puse esta lámpara en la habitación y desde la primera noche la diferencia fue brutal. Se escucha cuando caen los insectos. Funciona de verdad.', '2025-12-15T20:00:00-05:00'),
  ('Carmen L.', 5, 'Segura para mis hijos', 'Me preocupaba usar repelentes químicos con los niños. Esta lámpara es 100% segura, no tiene olor y los niños ni la notan. La prendo al atardecer y para la hora de dormir ya no hay ni un mosquito. Excelente compra.', '2026-01-22T21:15:00-05:00'),
  ('Alejandro B.', 4, 'Eficiente y silenciosa', 'Pensé que haría ruido pero es bastante silenciosa. La luz UV atrae a los insectos y la rejilla los elimina sin problema. Consume poca energía y la dejo prendida toda la noche. Solo le doy 4 porque me hubiera gustado que fuera un poco más grande.', '2026-02-06T19:30:00-05:00'),
  ('Gloria E.', 5, 'Ideal para la finca', 'La tengo en la finca en el Quindío donde hay muchos insectos. Es impresionante la cantidad de zancudos que atrapa en una sola noche. La limpieza es fácil con la bandejita que trae. Voy a pedir otra para la terraza.', '2026-02-20T22:00:00-05:00'),
  ('Nicolás S.', 5, 'Funciona mejor que los repelentes', 'Probé citronela, espirales, repelentes en spray y nada funcionaba bien. Esta lámpara fue la solución definitiva. La pongo en la sala después de las 6 pm y amanezco sin una sola picadura. La recomiendo totalmente.', '2026-03-07T18:45:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'lampara-mata-zancudos-electrica';

-- 8. ASPIRADORA INALÁMBRICA DE MANO
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Ana María G.', 5, 'Perfecta para el carro', 'La compré principalmente para aspirar el carro y es una maravilla. Liviana, potente y la batería dura lo suficiente para limpiar todo el interior. También la uso para las migajas del sofá. Muy práctica.', '2025-12-22T09:00:00-05:00'),
  ('Fernando Q.', 4, 'Buena succión para su tamaño', 'No esperaba tanta potencia en algo tan pequeño. Aspira pelo de mascotas, polvo y migajas sin problema. La batería dura unos 20-25 minutos que es suficiente. Le doy 4 porque tarda un poco en cargar completamente.', '2026-01-30T14:00:00-05:00'),
  ('Claudia R.', 5, 'La uso todos los días', 'Tengo 2 gatos y el pelo era un problema en todos los muebles. Con esta aspiradora paso rápido el sofá, las sillas y las camas en 10 minutos. Los filtros se lavan fácil. Es mi electrodoméstico más usado ahora.', '2026-02-11T11:30:00-05:00'),
  ('Pedro J.', 5, 'Compacta y potente', 'La guardo en un cajón y la saco cuando necesito. Es tan liviana que hasta mi hijo de 8 años la puede usar. La succión es sorprendente para el tamaño. Los accesorios que trae son útiles, especialmente la boquilla para rincones.', '2026-02-28T16:20:00-05:00'),
  ('Mónica H.', 4, 'Muy útil para limpieza rápida', 'No reemplaza una aspiradora grande pero para limpieza rápida del día a día es perfecta. La uso para el escritorio, el teclado del computador, las escaleras y el carro. La relación calidad-precio es excelente.', '2026-03-10T13:00:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'aspiradora-inalambrica-de-mano';

-- 9. COMBO CARGADOR 4 EN 1 + ADAPTADOR + CABLE
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Julián M.', 5, 'Todo lo que necesitaba en un combo', 'Tenía el celular, los audífonos y el reloj cargando con cables diferentes por toda la mesa. Este combo organizó todo. Cargo los 3 dispositivos al tiempo y el cable es de buena calidad, no es de esos genéricos que se dañan al mes.', '2025-12-28T10:15:00-05:00'),
  ('Manuela O.', 5, 'Excelente para viajes', 'Viajo mucho por trabajo y antes llevaba 4 cargadores. Ahora llevo solo este combo y listo. Ocupa poco espacio y carga rápido. El adaptador es universal y el cable tiene conector magnético que es súper práctico.', '2026-01-14T08:45:00-05:00'),
  ('Tomás R.', 4, 'Buen combo a buen precio', 'Los materiales son buenos y la carga es estable. El cable es grueso y se siente resistente. Lo único es que hubiera sido perfecto si el adaptador tuviera USB-C además de USB-A. Pero por el precio es un combo muy completo.', '2026-02-04T17:30:00-05:00'),
  ('Gabriela S.', 5, 'Se lo compré a toda mi familia', 'Primero compré uno para mí y me gustó tanto que pedí 3 más para mi mamá, mi hermana y mi papá. Los 4 funcionan perfecto después de varias semanas. Carga rápido y el cable es largo, que era algo que me importaba mucho.', '2026-02-19T12:00:00-05:00'),
  ('Iván P.', 5, 'Práctica y conveniente', 'Ya no peleo por los cargadores en la casa. Cada uno tiene su combo y todo funciona perfecto. La calidad de carga es buena, no calienta y la velocidad es decente. Para el precio no se puede pedir más. Muy recomendado.', '2026-03-06T15:10:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'combo-cargador-4-en-1-adaptadorcable';

-- 10. DEPILADOR FACIAL ELÉCTRICO RECARGABLE
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Adriana C.', 5, 'Indoloro y efectivo', 'Lo uso para el vello facial y bigote. No duele nada, es como pasar un lápiz por la piel. Los resultados son limpios y la piel queda suave. La batería dura bastante y se carga por USB. Mucho mejor que la cera.', '2025-12-10T09:30:00-05:00'),
  ('Marcela T.', 5, 'Discreto y práctico', 'Es tan pequeño que lo llevo en el bolso y nadie sabe qué es. Lo uso para retoques rápidos antes de reuniones. No irrita la piel y los resultados son inmediatos. Ya llevo 3 meses usándolo y sigue funcionando como nuevo.', '2026-01-16T13:00:00-05:00'),
  ('Sandra W.', 4, 'Bueno para vellos finos', 'Para el vello facial fino funciona increíble. Para vellos más gruesos hay que pasar varias veces pero igual los quita. La cabeza de repuesto que trae es un plus. Es cómodo de usar y la forma ergonómica ayuda a llegar a todas las zonas.', '2026-02-07T10:45:00-05:00'),
  ('Katherine D.', 5, 'Adiós a las citas de depilación', 'Gastaba $30.000 mensuales en depilación facial. Este aparatico me ahorró esa plata y lo puedo usar cuando quiera en mi casa. Es silencioso, no deja irritación y es súper higiénico. Una de las mejores compras que he hecho.', '2026-02-24T16:00:00-05:00'),
  ('Rosa El.', 5, 'Lo mejor para pieles sensibles', 'Tengo piel muy sensible y la cera me dejaba roja por horas. Con este depilador no tengo ese problema. Lo paso suave, quita el vello y mi piel queda perfecta. Se lo recomendé a todas mis amigas del trabajo.', '2026-03-09T11:20:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'depilador-facial-electrico-recargable';

-- 11. CORRECTOR DE POSTURA AJUSTABLE
INSERT INTO product_reviews (product_id, reviewer_name, rating, title, body, is_verified_purchase, is_approved, created_at)
SELECT p.id, r.reviewer_name, r.rating, r.title, r.body, true, true, r.created_at::timestamptz
FROM products p,
(VALUES
  ('Camilo V.', 5, 'Se nota la diferencia desde el primer día', 'Trabajo en oficina 9 horas diarias y siempre terminaba con dolor de espalda. Me puse el corrector el primer día y al final de la jornada la diferencia fue increíble. Es cómodo debajo de la camisa y nadie nota que lo traigo puesto. Lo uso ya hace 3 semanas y la postura me cambió.', '2026-01-10T09:00:00-05:00'),
  ('Viviana M.', 5, 'Me lo recomendó mi fisioterapeuta', 'Mi fisio me dijo que usara un corrector de postura como complemento a la terapia. Busqué varios y este tenía buenas reseñas. Es ajustable, no aprieta de más y el material no da calor. Ya llevo un mes y el dolor de cuello disminuyó muchísimo. Muy agradecida.', '2026-01-28T14:30:00-05:00'),
  ('Mauricio R.', 4, 'Bueno pero hay que acostumbrarse', 'Los primeros 3 días fue incómodo porque no estaba acostumbrado a estar derecho jaja. Pero después de la primera semana ya ni lo siento. Es discreto debajo de la ropa y los velcros son fuertes. Le doy 4 porque las instrucciones podrían ser más claras, pero el producto es bueno.', '2026-02-09T11:15:00-05:00'),
  ('Esperanza L.', 5, 'Perfecto para estudiar', 'Soy estudiante de medicina y paso horas sentada leyendo. Con el corrector ya no me encorvo y termino el día sin dolor. Es liviano, se lava a mano y seca rápido. Lo mejor es que es ajustable, yo soy delgada y me queda perfecto. Se lo regalé a mi mamá también.', '2026-02-23T16:45:00-05:00'),
  ('Diego A.', 5, 'Inversión en salud', 'Tengo 45 años y la espalda ya me estaba pasando factura. Este corrector me ayudó a ser consciente de mi postura durante el día. No es mágico, hay que ser constante, pero funciona. El material es transpirable y no molesta. Muy satisfecho con la compra, ojalá lo hubiera comprado antes.', '2026-03-12T10:30:00-05:00')
) AS r(reviewer_name, rating, title, body, created_at)
WHERE p.slug = 'corrector-de-postura';

-- ============================================================
-- VERIFICACIÓN: Ejecuta esto después para confirmar
-- ============================================================
-- SELECT p.name, COUNT(r.id) as total_reviews, ROUND(AVG(r.rating), 1) as avg_rating
-- FROM products p
-- LEFT JOIN product_reviews r ON r.product_id = p.id AND r.is_approved = true
-- WHERE p.is_active = true
-- GROUP BY p.name
-- ORDER BY p.name;

