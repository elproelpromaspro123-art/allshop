# Variables de Entorno - Vortixy E-commerce

## 📋 Resumen

La aplicación usa **15 variables de entorno** clasificadas en 3 categorías:

| Categoría | Cantidad | Requerido en Prod | Consecuencia si falta |
|-----------|----------|-------------------|----------------------|
| **CRITICAL** | 3 | ✅ Siempre | La app NO funciona |
| **SECURITY** | 2 | ✅ Producción | Vulnerabilidades de seguridad |
| **OPTIONAL** | 10 | ❌ Opcional | Features limitados |

---

## 🔴 CRITICAL - Requeridas para funcionar

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Tipo:** URL pública
- **Ejemplo:** `https://xxxxx.supabase.co`
- **Uso:** Conexión a Supabase (cliente y servidor)
- **Dónde obtener:** [Supabase Dashboard](https://app.supabase.com) > Settings > API
- **Archivos que la usan:**
  - `src/lib/supabase.ts`
  - `src/lib/supabase-admin.ts`
  - `next.config.ts` (OG images)
  - `src/app/api/admin/*/route.ts`

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Tipo:** String (JWT public key)
- **Ejemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Uso:** Autenticación anónima con Supabase
- **Dónde obtener:** [Supabase Dashboard](https://app.supabase.com) > Settings > API
- **Archivos que la usan:**
  - `src/lib/supabase.ts`

### 3. `SUPABASE_SERVICE_ROLE_KEY`
- **Tipo:** String (JWT secret key) - **MANTENER SECRETO**
- **Ejemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Uso:** Operaciones administrativas en Supabase
- **Dónde obtener:** [Supabase Dashboard](https://app.supabase.com) > Settings > API
- **Archivos que la usan:**
  - `src/lib/supabase-admin.ts`
  - `src/app/api/admin/orders/route.ts`
  - `src/app/api/admin/inventory/route.ts`
  - `src/app/api/admin/metrics/route.ts`
  - `scripts/check-env.ts`

---

## 🟡 SECURITY - Requeridas en producción

### 4. `CSRF_SECRET`
- **Tipo:** String (mínimo 32 caracteres)
- **Ejemplo:** `tu_secreto_muy_largo_y_aleatorio_aqui_12345`
- **Uso:** Protección contra ataques CSRF en checkout y formularios
- **Fallback:** Usa `ORDER_LOOKUP_SECRET` si no está configurado
- **Archivos que la usan:**
  - `src/lib/csrf.ts` (generación y validación de tokens)
  - `src/app/api/internal/csrf/route.ts`
  - `src/app/api/checkout/route.ts`
  - `src/proxy.ts` (middleware)
- **Recomendación:** Generar con `crypto.randomBytes(32).toString('hex')`

### 5. `ORDER_LOOKUP_SECRET`
- **Tipo:** String (mínimo 32 caracteres)
- **Ejemplo:** `otro_secreto_largo_para_lookup_de_ordenes_67890`
- **Uso:** 
  - Protección de consulta de órdenes
  - Fallback para CSRF_SECRET
  - Admin panel authentication
- **Archivos que la usan:**
  - `src/lib/order-token.ts`
  - `src/lib/order-history-token.ts`
  - `src/lib/csrf.ts`
  - `src/lib/catalog-admin-auth.ts`
  - `src/app/api/orders/confirm-email/route.ts`
  - `src/app/api/admin/block-ip/route.ts`
  - `src/app/api/admin/orders/cancel/route.ts`

---

## 🟢 OPTIONAL - Características opcionales

### 6. `GROQ_API`
- **Tipo:** API Key
- **Uso:** Chat con IA para atención al cliente
- **Dónde obtener:** [Groq Console](https://console.groq.com)
- **Archivos que la usan:** `src/app/api/chat/route.ts`
- **Si falta:** El chat no funciona, pero la app sí

### 7. `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`
- **Tipo:** String (ID numérico)
- **Ejemplo:** `1234567890123456`
- **Uso:** Tracking de Facebook/Meta Ads
- **Dónde obtener:** [Facebook Events Manager](https://www.facebook.com/events_manager)
- **Archivos que la usan:** `src/components/FacebookPixel.tsx`
- **Si falta:** No hay tracking de ads

### 8. `NEXT_PUBLIC_APP_URL`
- **Tipo:** URL
- **Ejemplo:** `https://vortixy.net` o `http://localhost:3000`
- **Uso:** URLs absolutas para correos, Discord, OG images
- **Archivos que la usan:**
  - `src/lib/site.ts`
  - `src/lib/notifications.ts`
  - `src/lib/discord.ts`
  - `next.config.ts`

### 9. `NEXT_PUBLIC_USAGE_MODE`
- **Tipo:** String (`free` | `premium`)
- **Ejemplo:** `free`
- **Uso:** Controlar modo de uso/free-tier
- **Archivos que la usan:** `src/lib/polling-intervals.ts`

### 10. `CATALOG_ADMIN_ACCESS_CODE`
- **Tipo:** String
- **Uso:** Acceso al panel de administración de catálogo
- **Archivos que la usan:**
  - `src/lib/catalog-admin-auth.ts`
  - `src/app/api/internal/catalog/control/route.ts`
  - `src/app/api/internal/orders/control/route.ts`

### 11. `CATALOG_ADMIN_PATH_TOKEN`
- **Tipo:** String
- **Uso:** Token para ruta del panel privado
- **Archivos que la usan:**
  - `src/lib/catalog-admin-auth.ts`
  - `src/app/api/internal/panel/session/route.ts`

### 12. `VPNAPI_KEY`
- **Tipo:** API Key
- **Uso:** Detección de VPN/proxy para seguridad
- **Dónde obtener:** [VPNAPI.io](https://vpnapi.io)
- **Archivos que la usan:** `src/lib/vpn-detect.ts`
- **Si falta:** No hay detección de VPN (solo detección básica por IP)

### 13. `DISCORD_WEBHOOK_URL`
- **Tipo:** URL de webhook
- **Ejemplo:** `https://discord.com/api/webhooks/xxxxx/yyyyy`
- **Uso:** 
  - Notificaciones de feedback
  - Logs de errores
  - Alertas de seguridad
- **Dónde obtener:** Discord Server > Settings > Integrations > Webhooks
- **Archivos que la usan:**
  - `src/lib/discord.ts`
  - `src/lib/feedback-discord.ts`
  - `src/lib/logger.ts`
- **Si falta:** No hay notificaciones en Discord

### 14. `SMTP_USER`
- **Tipo:** Email/Username
- **Ejemplo:** `vortixy@gmail.com` o `apikey`
- **Uso:** Envío de correos de confirmación de pedidos
- **Archivos que la usan:** `src/lib/notifications.ts`
- **Si falta:** No se envían correos a clientes

### 15. `SMTP_PASSWORD`
- **Tipo:** Password o API Key
- **Uso:** Autenticación SMTP
- **Archivos que la usan:** `src/lib/notifications.ts`
- **Si falta:** No se envían correos a clientes

### 16. `EMAIL_FROM`
- **Tipo:** Email con nombre
- **Ejemplo:** `Vortixy <vortixyoficial@gmail.com>`
- **Default:** `Vortixy <vortixyoficial@gmail.com>`
- **Uso:** Remitente de correos
- **Archivos que la usan:** `src/lib/notifications.ts`

---

## 🧪 Verificación

### Script de verificación

```bash
# Verificar variables en desarrollo
node scripts/check-env.ts

# Verificar variables en producción (más estricto)
NODE_ENV=production node scripts/check-env.ts
```

### Qué verifica el script:

1. **CRITICAL:** Siempre verifica (dev o prod)
2. **SECURITY:** Solo verifica en producción
3. **OPTIONAL:** Solo muestra warning si faltan

---

## 🔐 Mejores Prácticas

### 1. Generación de secretos

```bash
# Generar CSRF_SECRET (32 bytes = 64 chars hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar ORDER_LOOKUP_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Variables en Vercel

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega todas las variables CRITICAL y SECURITY
4. Las OPTIONAL según necesites

### 3. Variables en desarrollo

1. Copia `.env.example` a `.env.local`
2. Configura al menos las CRITICAL
3. Las SECURITY puedes usar las mismas de prod (seguro) o generar nuevas

### 4. Rotación de secretos

- **CSRF_SECRET:** Rotar cada 90 días
- **ORDER_LOOKUP_SECRET:** Rotar cada 90 días
- **SUPABASE_*:** Rotar si hay sospecha de compromiso

---

## 📊 Matriz de Features

| Feature | Variables Requeridas |
|---------|---------------------|
| **Tienda básica** | SUPABASE_* |
| **Checkout** | SUPABASE_*, CSRF_SECRET u ORDER_LOOKUP_SECRET |
| **Consulta de órdenes** | ORDER_LOOKUP_SECRET |
| **Panel Admin** | CATALOG_ADMIN_ACCESS_CODE, CATALOG_ADMIN_PATH_TOKEN |
| **Emails a clientes** | SMTP_USER, SMTP_PASSWORD, EMAIL_FROM |
| **Notificaciones Discord** | DISCORD_WEBHOOK_URL |
| **Chat IA** | GROQ_API |
| **Facebook Ads** | NEXT_PUBLIC_FACEBOOK_PIXEL_ID |
| **Detección VPN** | VPNAPI_KEY |

---

## 🚨 Troubleshooting

### Error: "Missing CSRF token"
- Verifica que `CSRF_SECRET` o `ORDER_LOOKUP_SECRET` estén configurados
- En desarrollo, el fallback funciona sin secreto
- En producción, es obligatorio

### Error: "Invalid Supabase URL"
- Verifica `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
- Asegúrate que la URL sea válida (https://)

### No llegan correos
- Verifica `SMTP_USER` y `SMTP_PASSWORD`
- Para Gmail: usa App Password, no tu password normal
- Verifica `EMAIL_FROM` tenga formato válido

### Discord no notifica
- Verifica `DISCORD_WEBHOOK_URL` sea válida
- Prueba el webhook manualmente en Discord

---

## 📝 Checklist de Deploy

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `CSRF_SECRET` configurada (32+ chars)
- [ ] `ORDER_LOOKUP_SECRET` configurada (32+ chars)
- [ ] `NEXT_PUBLIC_APP_URL` actualizada al dominio real
- [ ] Variables opcionales configuradas según necesidades
- [ ] Script `check-env.ts` pasa sin errores
- [ ] `.env.local` NO está en git

---

**Última actualización:** Marzo 2026  
**Versión:** 1.0
