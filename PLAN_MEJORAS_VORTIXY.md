# Plan de Mejoras para Vortixy

## 📊 Análisis Actual

**Stack:** Next.js 16, React 19, Supabase, Tailwind CSS 4, Framer Motion, Chatbot GROQ
**Funcionalidades:** Catálogo, Carrito, Checkout, Pedidos, Chatbot, Notificaciones, Admin

---

## 🎯 Mejoras Priorizadas por Impacto

### 🔴 PRIORIDAD ALTA (Impacto inmediato en conversiones)

#### 1. Sistema de Cupones y Descuentos
**Impacto:** ⭐⭐⭐⭐⭐ (Aumenta conversiones 15-25%)
**Complejidad:** Media
**Archivos a modificar:**
- `src/lib/pricing.ts` - Agregar lógica de cupones
- `src/components/checkout/CheckoutOrderSummary.tsx` - UI para aplicar cupones
- `data/schema/migrations/` - Nueva tabla `coupons`
- `src/app/api/checkout/route.ts` - Validar cupones en backend

**Descripción:**
- Crear tabla `coupons` con campos: code, discount_type (percentage/fixed), discount_value, min_order, max_uses, expires_at, is_active
- API para validar cupones
- UI en checkout para ingresar código
- Aplicar descuento antes de calcular total
- Notificar cuando el cupón se aplica exitosamente

---

#### 2. Sistema de Wishlist/Lista de Deseos
**Impacto:** ⭐⭐⭐⭐⭐ (Aumenta retención 20-30%)
**Complejidad:** Baja-Media
**Archivos a modificar:**
- `src/store/wishlist.ts` - Nuevo store con Zustand
- `src/components/ProductCard.tsx` - Botón de corazón
- `src/app/wishlist/page.tsx` - Página de wishlist
- `src/components/HeaderClient.tsx` - Icono de wishlist en header

**Descripción:**
- Store de Zustand para wishlist (persistir en localStorage)
- Botón de corazón en cada producto
- Página dedicada para ver wishlist
- Contador en header
- Opción de agregar al carrito desde wishlist
- Compartir wishlist por WhatsApp/email

---

#### 3. Filtros Avanzados de Búsqueda
**Impacto:** ⭐⭐⭐⭐ (Mejora UX, reduce rebote 10-15%)
**Complejidad:** Media
**Archivos a modificar:**
- `src/components/SearchDialog.tsx` - Agregar filtros
- `src/lib/catalog-runtime.ts` - Lógica de filtrado
- `src/components/home/HomeProducts.tsx` - Filtros en catálogo

**Descripción:**
- Filtro por rango de precio (slider)
- Filtro por categoría
- Filtro por ubicación de stock (nacional/internacional)
- Filtro por envío gratis
- Filtro por rating mínimo
- Ordenar por: precio, popularidad, rating, recientes
- Filtros combinados con URL params para compartir

---

#### 4. Schema.org para Productos (SEO)
**Impacto:** ⭐⭐⭐⭐ (Mejora SEO 20-30%)
**Complejidad:** Baja
**Archivos a modificar:**
- `src/app/producto/[slug]/page.tsx` - Agregar JSON-LD
- `src/lib/json-ld.ts` - Funciones para schema de producto

**Descripción:**
- Schema.org Product con: name, description, image, price, currency, availability, brand, sku, reviews, aggregateRating
- Schema.org Offer con: price, priceCurrency, availability, seller
- Schema.org BreadcrumbList para navegación
- Schema.org Review para reseñas
- Mejorar rich snippets en Google

---

### 🟡 PRIORIDAD MEDIA (Mejora experiencia y retención)

#### 5. Comparador de Productos
**Impacto:** ⭐⭐⭐⭐ (Aumenta conversión 10-15%)
**Complejidad:** Media
**Archivos a modificar:**
- `src/components/ProductCompare.tsx` - Nuevo componente
- `src/store/compare.ts` - Store de comparación
- `src/components/ProductCard.tsx` - Botón de comparar
- `src/app/compare/page.tsx` - Página de comparación

**Descripción:**
- Permitir comparar hasta 4 productos
- Tabla comparativa con: precio, características, rating, envío
- Resaltar diferencias
- Botón "Agregar al carrito" desde comparación
- Persistir en localStorage

---

#### 6. Sistema de Recomendaciones Inteligentes
**Impacto:** ⭐⭐⭐⭐ (Aumenta ticket promedio 15-20%)
**Complejidad:** Alta
**Archivos a modificar:**
- `src/lib/recommendations.ts` - Lógica de recomendaciones
- `src/components/ProductCard.tsx` - "Productos relacionados"
- `src/app/producto/[slug]/page.tsx` - Sección de recomendaciones
- `src/components/checkout/CheckoutOrderSummary.tsx` - "También te puede interesar"

**Descripción:**
- Recomendaciones basadas en:
  - Categoría del producto actual
  - Productos frecuentemente comprados juntos
  - Historial de navegación (sessionStorage)
  - Productos mejor valorados de la categoría
- Sección "Productos relacionados" en página de producto
- "También te puede interesar" en checkout
- "Clientes que compraron esto también compraron"

---

#### 7. Notificaciones Push del Navegador
**Impacto:** ⭐⭐⭐⭐ (Aumenta retención 25-35%)
**Complejidad:** Media-Alta
**Archivos a modificar:**
- `public/sw.js` - Service Worker
- `src/components/PushNotificationManager.tsx` - Nuevo componente
- `src/app/api/notifications/subscribe/route.ts` - API para suscripciones
- `src/lib/notifications.ts` - Agregar push notifications

**Descripción:**
- Solicitar permiso para notificaciones push
- Notificar cuando:
  - Pedido cambia de estado
  - Producto en wishlist tiene descuento
  - Nuevo producto en categoría favorita
  - Recordatorio de carrito abandonado
- Usar Web Push API con VAPID keys
- Service Worker para manejar notificaciones

---

#### 8. Modo Oscuro
**Impacto:** ⭐⭐⭐ (Mejora UX, reduce fatiga visual)
**Complejidad:** Baja-Media
**Archivos a modificar:**
- `src/app/globals.css` - Variables CSS para modo oscuro
- `src/components/ThemeToggle.tsx` - Botón de toggle
- `src/components/HeaderClient.tsx` - Agregar toggle en header
- `src/providers/ThemeProvider.tsx` - Provider de tema

**Descripción:**
- Detectar preferencia del sistema
- Toggle manual en header
- Persistir preferencia en localStorage
- Transiciones suaves entre modos
- Mantener contraste de colores adecuado

---

#### 9. Sistema de Reseñas Mejorado
**Impacto:** ⭐⭐⭐⭐ (Aumenta confianza y conversiones)
**Complejidad:** Media
**Archivos a modificar:**
- `src/components/ReviewForm.tsx` - Formulario de reseñas
- `src/components/ReviewList.tsx` - Lista de reseñas
- `src/app/api/reviews/route.ts` - API para reseñas
- `src/app/producto/[slug]/page.tsx` - Integrar reseñas

**Descripción:**
- Permitir reseñas con texto y rating (1-5 estrellas)
- Filtrar reseñas por rating
- Ordenar por: más recientes, más útiles, mejor rating
- Mostrar "reseña verificada" para compradores
- Fotos en reseñas
- Respuesta del vendedor
- Moderación de reseñas

---

### 🟢 PRIORIDAD BAJA (Mejoras a largo plazo)

#### 10. Sistema de Puntos/Recompensas
**Impacto:** ⭐⭐⭐⭐ (Aumenta lealtad 30-40%)
**Complejidad:** Alta
**Descripción:**
- Ganar puntos por compras (1 punto = $1000 COP)
- Canjear puntos por descuentos
- Niveles de membresía (Bronce, Plata, Oro, Platino)
- Beneficios por nivel
- Historial de puntos
- Expiración de puntos

---

#### 11. Chat en Vivo con Agentes
**Impacto:** ⭐⭐⭐⭐ (Mejora soporte, reduce abandono)
**Complejidad:** Alta
**Descripción:**
- Integrar con servicio de chat (Crisp, Intercom, o custom)
- Indicador de "agente disponible"
- Cola de espera
- Transferencia de chatbot a agente humano
- Historial de conversaciones
- Calificación de soporte

---

#### 12. App Móvil Nativa (PWA Mejorada)
**Impacto:** ⭐⭐⭐⭐ (Mejora engagement 40-50%)
**Complejidad:** Alta
**Descripción:**
- PWA completa con:
  - Instalación en pantalla de inicio
  - Modo offline para catálogo
  - Notificaciones push
  - Splash screen personalizada
  - Iconos de app
- Considerar React Native para app nativa

---

#### 13. Dashboard de Analytics Avanzado
**Impacto:** ⭐⭐⭐ (Mejora toma de decisiones)
**Complejidad:** Media-Alta
**Descripción:**
- Métricas de ventas en tiempo real
- Productos más vendidos
- Tasa de conversión por página
- Carritos abandonados
- Fuente de tráfico
- Comportamiento de usuarios
- Exportar reportes

---

#### 14. Integración con Pasarelas de Pago
**Impacto:** ⭐⭐⭐⭐⭐ (Aumenta conversiones 30-40%)
**Complejidad:** Alta
**Descripción:**
- Integrar con:
  - Mercado Pago (popular en Colombia)
  - Wompi (pasarela colombiana)
  - Stripe (internacional)
  - PayPal
- Mantener opción de contra entrega
- Pago en cuotas
- Webhooks para confirmación de pago

---

#### 15. Sistema de Devoluciones Automatizado
**Impacto:** ⭐⭐⭐ (Mejora confianza)
**Complejidad:** Media
**Descripción:**
- Formulario de solicitud de devolución
- Generación automática de guía de devolución
- Seguimiento de devoluciones
- Reembolso automático
- Políticas claras por producto

---

## 📈 Métricas de Éxito

### Corto Plazo (1-2 meses)
- [ ] Implementar cupones → Aumentar conversiones 15%
- [ ] Implementar wishlist → Aumentar retención 20%
- [ ] Mejorar SEO con schema.org → Aumentar tráfico orgánico 25%

### Mediano Plazo (3-4 meses)
- [ ] Filtros avanzados → Reducir rebote 15%
- [ ] Comparador de productos → Aumentar conversión 10%
- [ ] Recomendaciones → Aumentar ticket promedio 15%

### Largo Plazo (5-6 meses)
- [ ] Notificaciones push → Aumentar retención 30%
- [ ] Sistema de puntos → Aumentar lealtad 35%
- [ ] Pasarelas de pago → Aumentar conversiones 35%

---

## 🛠️ Implementación Recomendada

### Fase 1 (Semanas 1-4): Quick Wins
1. Sistema de cupones
2. Wishlist
3. Schema.org para SEO

### Fase 2 (Semanas 5-8): UX Mejorada
4. Filtros avanzados
5. Comparador de productos
6. Modo oscuro

### Fase 3 (Semanas 9-12): Engagement
7. Recomendaciones inteligentes
8. Notificaciones push
9. Sistema de reseñas mejorado

### Fase 4 (Semanas 13-16): Crecimiento
10. Sistema de puntos
11. Chat en vivo
12. Pasarelas de pago

---

## 💡 Recomendaciones Adicionales

### Performance
- Implementar ISR (Incremental Static Regeneration) para páginas de productos
- Optimizar imágenes con next/image más agresivamente
- Implementar CDN para assets estáticos
- Lazy loading de componentes pesados

### Seguridad
- Implementar autenticación de usuarios (NextAuth.js)
- Agregar 2FA para administradores
- Auditoría de acciones administrativas
- Rate limiting más granular

### Marketing
- Sistema de referidos
- Programa de afiliados
- Integración con Google Shopping
- Integración con Facebook Marketplace
- Email marketing automatizado

### Operaciones
- Dashboard de inventario en tiempo real
- Alertas de stock bajo automáticas
- Integración con proveedores de envío (Servientrega, Coordinadora)
- Generación automática de guías de envío
- Reportes de ventas diarios/semanales/mensuales

---

## 📝 Notas Técnicas

### Dependencias a agregar
```json
{
  "dependencies": {
    "next-auth": "^4.24.0",
    "@next-auth/prisma-adapter": "^1.0.7",
    "web-push": "^3.6.0",
    "sharp": "^0.33.0"
  }
}
```

### Variables de entorno nuevas
```env
# Cupones
COUPON_ENCRYPTION_KEY=...

# Notificaciones Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Pasarelas de pago
MERCADOPAGO_ACCESS_TOKEN=...
WOMPI_PRIVATE_KEY=...
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# Autenticación
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### Migraciones de base de datos necesarias
1. Tabla `coupons`
2. Tabla `wishlist_items`
3. Tabla `reviews` (mejorada)
4. Tabla `user_points`
5. Tabla `push_subscriptions`
6. Tabla `compare_sessions`

---

## 🎯 Próximos Pasos

1. **Revisar este plan** con el equipo
2. **Priorizar** según recursos disponibles
3. **Estimar tiempos** para cada fase
4. **Comenzar implementación** por Fase 1
5. **Medir resultados** después de cada fase
6. **Iterar** basándose en datos reales

---

**Creado:** 2026-03-21
**Última actualización:** 2026-03-21
**Estado:** Pendiente de revisión
