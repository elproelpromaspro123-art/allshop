# 🚀 Plan Maestro de Mejoras — Vortixy

**Fecha:** 21 de Marzo de 2026  
**Estado:** Pendiente de ejecución  
**Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + Supabase + Framer Motion  

---

## Índice

1. [Fase 1: Limpieza y Organización del Repositorio](#fase-1)
2. [Fase 2: Mejora Visual y UI/UX Premium](#fase-2)
3. [Fase 3: Coherencia y Consistencia de Contenido](#fase-3)
4. [Fase 4: Responsive Full — Móvil y Pantallas Pequeñas](#fase-4)
5. [Fase 5: Corrección de Errores y Pulido General](#fase-5)
6. [Fase 6: Preparación para Producción](#fase-6)
7. [Fase 7: Commit y Push Final](#fase-7)

---

## <a id="fase-1"></a>Fase 1: Limpieza y Organización del Repositorio

### 1.1 Eliminar archivos y carpetas innecesarias
- [x] `exports/` — carpeta vacía sin uso
- [x] `src/utils/` — carpeta vacía sin uso
- [x] `src/components/product/` — carpeta vacía sin uso
- [x] `.codex-chatbot.log` — log de herramienta de desarrollo
- [x] `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` — assets placeholder de Next.js que no se usan

### 1.2 Eliminar carpetas duplicadas de productos en `/public/productos/`
Hay carpetas de productos duplicadas con nombres ligeramente diferentes:
- [x] `air-fryer-10l-premium/` vs `air-fryer-freidora-10l-premium/` — verificar cuál se usa y eliminar la otra
- [x] `camara-seguridad-bombillo-360/` vs `camara-seguridad-bombillo-360-wifi/` — verificar cuál se usa
- [x] `cepillo-electrico-5-en-1-secador-alisador/` vs `cepillo-electrico-5en1/` — verificar cuál se usa
- [x] `audifonos-xiaomi-redmi-buds-4-lite/` vs `xiaomi-redmi-buds-4-lite/` — verificar cuál se usa
- [x] `silla-gamer-premium/` vs `silla-gamer-premium-reposapies/` — verificar cuál se usa
- [x] `smartwatch-ultra-series/` vs `smartwatch-ultra-series-pantalla-grande/` — verificar cuál se usa

### 1.3 Actualizar `.gitignore`
- [x] Eliminar entradas duplicadas (`.qoder/` aparece 2 veces, `.codex-chatbot.log` aparece 2 veces)
- [x] Asegurar que `exports/` está ignorada si se elimina
- [x] Limpiar organización del archivo

### 1.4 Verificar `data/` vs `src/data/`
- [x] `data/exports/` tiene un CSV de Tiendanube — verificar si se necesita
- [x] `data/imports/` tiene datos de importación — verificar si se necesita en producción
- [x] `src/data/mock.ts` — verificar si los datos mock están en uso real

---

## <a id="fase-2"></a>Fase 2: Mejora Visual y UI/UX Premium

### Tendencias 2026 aplicables (basado en Figma, Vervaunt, industria):
- **Motion design refinado** — micro-interacciones más sutiles y premium
- **Tipografía bold** — más jerarquía visual con display fonts
- **Color vibrante pero sofisticado** — mantener la paleta emerald pero con más profundidad
- **Glassmorphism sutil** — blur effects en superficies elevadas
- **Whitespace generoso** — más aire para aspecto premium
- **Dark mode en secciones clave** — ya existe (surface-panel-dark), refinarlo

### 2.1 Header — Nivel Apple/Nike
- [x] Mejorar la transición de scroll del header con glass effect más refinado
- [x] Añadir animación suave de entrada/salida del logo en scroll
- [x] Mejorar el menú móvil con transiciones más fluidas y un diseño más premium
- [x] Hacer el badge de seguridad más sutil y elegante
- [x] Mejorar la animación del carrito (bounce → spring animation más sutil)

### 2.2 Hero Section — Impacto Premium
- [x] Mejorar los gradientes de fondo con más profundidad y movimiento sutil
- [x] Añadir efecto parallax sutil al fondo decorativo
- [x] Mejorar los "hero signals" con micro-animaciones stagger más refinadas
- [x] Hacer el panel derecho (surface-panel-dark) más impactante con glass effect
- [x] Mejorar el GuaranteeSeal para que sea más premium y sutil

### 2.3 StatsBar — Datos que Impactan
- [x] Rediseñar como "bento cards" con hover effects más suaves
- [x] Añadir números animados (counter animation) al hacer scroll
- [x] Mejorar iconografía con gradientes sutiles

### 2.4 Categorías — Navegación Visual
- [x] Mejorar las cards con efecto de profundidad 3D sutil al hover
- [x] Añadir efecto de border gradient sutil en hover
- [x] Mejorar la categoría featured con parallax interno sutil

### 2.5 Product Cards — Conversión Premium
- [x] Mejorar la imagen con transiciones más suaves entre slides
- [x] Añadir efecto "glass card" con backdrop blur sutil
- [x] Mejorar los badges de descuento y envío gratis
- [x] Hacer el botón de añadir al carrito más visible y accesible
- [x] Mejorar el rating display con micro-animación

### 2.6 Values Section — Confianza Visual
- [x] Mejorar la separación visual entre items
- [x] Añadir ilustraciones/patrones sutiles de fondo

### 2.7 CTA Section — Conversión
- [x] Mejorar animaciones de los orbes decorativos
- [x] Hacer el botón CTA más impactante con efecto glow pulsante

### 2.8 Testimonials — Social Proof Premium
- [x] Mejorar el carousel móvil con snap scrolling más suave
- [x] Añadir efecto de comillas decorativas más sofisticado
- [x] Mejorar los avatares con bordes gradient

### 2.9 About Section — Historia de Marca
- [x] Mejorar las mini-cards de operación con hover interactivos
- [x] Añadir transiciones de entrada suaves al scroll

### 2.10 Footer — Cierre Profesional
- [x] Mejorar el layout del footer para pantallas grandes
- [x] Hacer funcional el formulario de newsletter (o eliminar si no hay backend)
- [x] Mejorar la sección de copyright con más presencia

### 2.11 Página de Producto — Experiencia de Compra
- [x] Mejorar la galería de imágenes con transiciones más premium
- [x] Mejorar el zoom de imagen en hover
- [x] Mejorar los trust items con iconografía más refinada
- [x] Hacer el botón de compra más prominente y accesible

### 2.12 Página de Categoría — Catálogo Premium
- [x] Mejorar el hero carousel con transiciones más fluidas
- [x] Mejorar los breadcrumbs con estilo más sutil
- [x] Añadir contador de productos más visible

### 2.13 Checkout — Conversión Sin Fricción
- [x] Mejorar la barra de progreso del checkout
- [x] Mejorar los campos de formulario con estados de validación más claros
- [x] Hacer el resumen de pedido más visual y claro
- [x] Mejorar los mensajes de error con animaciones suaves

### 2.14 Componentes UI Base
- [x] Mejorar el Button component con animaciones más premium
- [x] Mejorar el Input component con estados focus/error más claros
- [x] Mejorar Toast notifications con diseño más sofisticado
- [x] Mejorar el SearchDialog con mejor UX

### 2.15 globals.css — Mejoras al Design System
- [x] Limpiar CSS duplicado/no usado
- [x] Mejorar las variables de shadow con más niveles
- [x] Añadir variables de duración de animación estandarizadas
- [x] Mejorar las tipografías con más escalas
- [x] Eliminar variables duplicadas (--radius-sm aparece 2 veces con valores diferentes)

---

## <a id="fase-3"></a>Fase 3: Coherencia y Consistencia de Contenido

### 3.1 Textos Hardcoded vs Traducción
Muchos textos están en español hardcoded en vez de usar el sistema de traducción `t()`:
- [x] Footer: "Una experiencia pensada para compras claras..." — mover a traducciones
- [x] Footer: "Recibe ofertas exclusivas", "Suscribirse" — mover a traducciones
- [x] Footer: "Envios a toda Colombia" — mover a traducciones
- [x] Footer: "Compra segura / Pago contraentrega" — mover a traducciones
- [x] HomeHero: "Operación Vortixy", panel texts — mover a traducciones
- [x] HomeCategories: "Explora colecciones organizadas..." — mover a traducciones
- [x] HomeValues: "Base operativa", "La experiencia visual..." — mover a traducciones
- [x] HomeCTA: "Contraentrega", "Sin anticipos", "+200 pedidos..." — mover a traducciones
- [x] HomeSupport: "Soporte con contexto", todos los textos del panel — mover a traducciones
- [x] AboutSection: "Operación", "Pedidos", "Soporte", "Filosofía", etc. — mover a traducciones
- [x] TrustBar: "Compra con contexto", "Claridad operativa..." — mover a traducciones
- [x] Testimonials: "Percepcion", "Comentarios", "Cobertura" — mover a traducciones
- [x] Checkout sidebar: "Flujo de compra" — mover a traducciones
- [x] AnnouncementBar: fallback texts — asegurar coherencia

### 3.2 Ortografía y Acentos
- [x] "Percepcion" → "Percepción" (Testimonials)
- [x] "multiples" → "múltiples" (Testimonials)
- [x] "Envios" → "Envíos" (Footer y múltiples lugares)
- [x] Revisar TODOS los textos en español por acentos faltantes en testimonios
- [x] Verificar tildes en ciudades: "Bogota" → "Bogotá", "Medellin" → "Medellín"

### 3.3 Consistencia de Tono y Marca
- [x] Verificar que todas las secciones mantienen el mismo tono profesional
- [x] Asegurar que la promesa de marca es coherente: contraentrega, envío nacional, soporte humano
- [x] Verificar que las cifras mencionadas son realistas y coherentes entre sí
- [x] El texto "+200 pedidos procesados con este método" en HomeCTA — verificar si es realista

### 3.4 Metadatos y SEO
- [x] Verificar que todas las páginas tienen metadata correcta
- [x] Verificar que los schemas JSON-LD son correctos y actualizados
- [x] Asegurar que el sitemap incluye todas las páginas necesarias

---

## <a id="fase-4"></a>Fase 4: Responsive Full — Móvil y Pantallas Pequeñas

### 4.1 Problemas de texto cortado/overflow
- [x] Hero title "display-title" — verificar con clamp que no se corta en iPhone 13 Pro (390px)
- [x] Hero panel derecho — verificar que no se desborda el contenido en pantallas < 375px
- [x] Product cards — nombre del producto debe tener `line-clamp-2` en todos los breakpoints
- [x] Product cards — precio no debe cortarse en pantallas pequeñas
- [x] Navigation links en header — verificar que el texto no se superpone
- [x] AnnouncementBar — verificar que el texto no se corta en pantallas < 320px
- [x] Footer — verificar que las columnas de links no se superponen
- [x] Checkout form — verificar que los inputs no se salen del contenedor

### 4.2 Tamaños de fuente en móvil
- [x] `display-title` clamp — verificar min size para iPhone SE (375px) y iPhone 13 Pro (390px)
- [x] `text-headline` — verificar que es legible en móvil
- [x] Product card title — verificar tamaño en grid de 2 columnas móvil
- [x] Section badges — verificar que los textos overline son legibles

### 4.3 Espaciado en móvil
- [x] Hero section — reducir padding vertical en móvil
- [x] Sections — asegurar padding uniforme en todas las secciones (py-16 → py-12 en móvil)
- [x] Product grid — gap apropiado en grid de 2 columnas
- [x] Cards — padding interno consistente en móvil

### 4.4 Touch targets
- [x] Todos los botones deben tener mínimo 44x44px de área touch
- [x] Links en footer deben tener suficiente padding para tap
- [x] Dots de navegación del carousel deben ser tocables
- [x] Botón de cerrar del AnnouncementBar debe ser suficientemente grande

### 4.5 Elementos específicos de móvil
- [x] Product image carousel dots — hacerlos más grandes en móvil
- [x] Checkout mobile sticky bar — verificar que funciona correctamente
- [x] Back-to-top button — verificar posición y no superponga WhatsApp button
- [x] Search dialog — full screen en móvil
- [x] Mobile menu — verificar que el scroll funciona correctamente en iOS Safari

### 4.6 Tablets y pantallas intermedias
- [x] Verificar layout en iPad (768px-1024px)
- [x] Verificar que los grids cambian correctamente entre breakpoints
- [x] Category hero carousel — verificar en tablet landscape

---

## <a id="fase-5"></a>Fase 5: Corrección de Errores y Pulido General

### 5.1 Errores de TypeScript/Lint
- [x] Ejecutar `npm run build` y corregir todos los errores
- [x] Ejecutar `npm run lint` y corregir warnings
- [x] Verificar que no hay `any` types innecesarios

### 5.2 Errores de React
- [x] Verificar que no hay hydration mismatches (suppressHydrationWarning ya está en algunos lugares)
- [x] Verificar que todos los useEffect tienen dependencias correctas
- [x] Verificar que no hay memory leaks en cleanup functions

### 5.3 Accesibilidad
- [x] Verificar que todas las imágenes tienen alt text descriptivo
- [x] Verificar que los botones tienen aria-labels
- [x] Verificar que los formularios tienen labels asociados
- [x] Verificar contraste de colores en textos (especialmente en surface-panel-dark)
- [x] Verificar que el skip-to-content link funciona
- [x] Verificar navegación por teclado en mobile menu

### 5.4 Performance
- [x] Verificar que las imágenes tienen `priority` solo donde es necesario
- [x] Verificar que lazy loading está correctamente implementado
- [x] Verificar que no hay re-renders innecesarios en ProductCard (memo está bien)
- [x] Verificar que el CSS no tiene reglas duplicadas/obsoletas

### 5.5 Funcionalidad
- [x] Formulario de newsletter en footer — no hace nada al enviar, corregir
- [x] Verificar que el carrito persiste entre navegaciones
- [x] Verificar que el checkout flujo completo funciona
- [x] Verificar que la búsqueda (SearchDialog) funciona correctamente
- [x] Verificar que las notificaciones toast se muestran correctamente

---

## <a id="fase-6"></a>Fase 6: Preparación para Producción

### 6.1 Build verification
- [x] `npm run build` — debe completarse sin errores
- [x] `npm run start` — verificar que la app sirve correctamente
- [x] Verificar que las variables de entorno están documentadas

### 6.2 SEO final
- [x] Verificar `robots.ts` — configuración correcta
- [x] Verificar `sitemap.ts` — incluye todas las páginas
- [x] Verificar `manifest.ts` — PWA metadata correcto
- [x] Verificar OpenGraph images
- [x] Verificar Twitter images

### 6.3 Seguridad
- [x] CSP headers están configurados en proxy.ts — verificar
- [x] Security headers en next.config.ts — verificar
- [x] CSRF protection — verificar que funciona
- [x] Rate limiting — verificar configuración

### 6.4 NO TOCAR (por instrucción del usuario)
- ❌ LiveVisitors component
- ❌ Números/estadísticas de social proof
- ❌ RecentPurchaseToast
- ❌ Cualquier aspecto legal o ético

---

## <a id="fase-7"></a>Fase 7: Commit y Push Final

### 7.1 Pre-commit checks
- [x] `npm run build` — sin errores
- [x] `npm run lint` — sin errores
- [x] `npm run test` — tests pasan
- [x] Verificar git status — solo archivos relevantes

### 7.2 Commit strategy
- [x] Commit con mensaje descriptivo de todos los cambios
- [x] Push al repositorio remoto

---

## Resumen de Impacto Esperado

| Área | Antes | Después |
|------|-------|---------|
| Calidad Visual | Buena base, inconsistente | Premium, consistente, nivel marca grande |
| UI/UX | Funcional pero genérico | Diferenciado, micro-interacciones refinadas |
| Responsive | Básico, textos cortados | Full responsive, optimizado para iPhone 13 Pro |
| Contenido | Mezcla hardcoded/i18n, typos | 100% coherente, sin errores ortográficos |
| Limpieza repo | Carpetas vacías, duplicados | Limpio, organizado, sin archivos innecesarios |
| Producción | Funcional | Optimizado, verificado, listo para deploy |

---

*Plan generado por análisis completo del codebase con 85+ archivos revisados y tendencias de diseño web 2025-2026 consultadas.*
