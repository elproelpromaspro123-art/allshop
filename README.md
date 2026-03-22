# Vortixy

Tienda Next.js enfocada en Colombia, con pedidos contra entrega y gestion manual de despacho.

## Requisitos

- Node.js 20+
- npm 10+

## Variables de entorno

Configura `.env.local` asi:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=vortixyoficial@gmail.com

# Supabase (obligatorio para operacion real)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Seguridad (obligatorio en produccion)
ORDER_LOOKUP_SECRET=...
CSRF_SECRET=...
ORDER_HISTORY_SECRET=...
ADMIN_BLOCK_SECRET=...
MAINTENANCE_SECRET=...
# Opcional: TTL del token de consulta de orden en minutos (default: 1440 = 24h)
ORDER_LOOKUP_TOKEN_TTL_MINUTES=1440
ORDER_HISTORY_TOKEN_TTL_MINUTES=15

# Email (obligatorio para notificaciones de estado)
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=Vortixy <vortixyoficial@gmail.com>

# Panel privado de catalogo operativo (obligatorio para gestion interna)
CATALOG_ADMIN_ACCESS_CODE=...
CATALOG_ADMIN_PATH_TOKEN=...

# Chat IA (obligatorio si el asistente estara activo en produccion)
GROQ_API=...
# Alias legacy aceptado temporalmente por compatibilidad
GROQ_API_KEY=...

# Opcional: forzar envio gratis por producto (IDs o slugs separados por coma)
# Recomendado definir ambas para mantener el mismo calculo en backend y frontend.
FREE_SHIPPING_PRODUCT_IDS=
NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_IDS=
FREE_SHIPPING_PRODUCT_SLUGS=
NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_SLUGS=

# Polling / modo ahorro (opcional para plan free)
# Si cualquiera de estos marca "free", se usan intervalos mas largos.
NEXT_PUBLIC_USAGE_MODE=free
NEXT_PUBLIC_SUPABASE_PLAN=free
NEXT_PUBLIC_ECO_MODE=1

# Facebook Pixel / analitica (opcional)
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=

# Alertas de stock bajo (opcional)
LOW_STOCK_ALERTS_ENABLED=1
LOW_STOCK_ALERT_THRESHOLD=5

# Deteccion avanzada de VPN / proxy (opcional)
VPNAPI_KEY=

```

Nota: el formulario de feedback de `/soporte` envia mensajes al mismo `DISCORD_WEBHOOK_URL`.
Nota: `GROQ_API_KEY` sigue siendo aceptado por compatibilidad, pero el nombre canonico ahora es `GROQ_API`.

## Bootstrap rapido de DB (si esta vacia)

Usa unicamente este archivo en Supabase SQL Editor:

```txt
data/schema/migrations/schema.sql
```

Ese archivo ya incluye esquema, RLS, indices, RPC de stock transaccional, catalogo canonico, stock operativo y reseñas semilla reejecutables.

Si usas DB existente y quieres la bandera por producto:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
```

## Flujo actual (contra entrega + confirmacion directa + despacho manual)

1. El cliente confirma el pedido en checkout (contra entrega).
2. Backend valida datos de entrega, recalcula precio/envio y guarda la orden en DB.
   El envio gratis aplica solo si todos los items del pedido estan marcados como `free_shipping`.
3. El pedido queda en estado `processing` y listo para gestion manual interna.
4. El equipo realiza despacho manual y actualiza estado cuando corresponda.
5. El cliente recibe correos de estado del pedido (si `SMTP_USER` y `SMTP_PASSWORD` estan configurados).

## Desarrollo

```bash
npm install
npm run dev
```

## Validacion y Testing

```bash
# Contrato de variables / documentacion
npm run check-env

# Validacion estática y de tipos
npm run lint

# Tests unitarios y de integración (Vitest)
npm run test

# Tests End-to-End / smoke (Playwright)
npm run test:playwright

# Build de producción
npm run build
```

## Observabilidad y Endpoints Administrativos

- **Health Check (`/api/health`)**: Retorna el estado en tiempo real de Supabase, SMTP, Discord, Groq y métricas de uptime de la aplicación.
- **Métricas (`/api/admin/metrics`)**: Proveen datos clave de ventas, ingresos, y productos de inventario bajo, calculados en base a `AdminDashboardMetrics`.

## Seguridad implementada

- Recalculo server-side de subtotal y envio.
- Validaciones estrictas de datos de entrega antes de aceptar el pedido.
- Limitador de tasa en endpoints sensibles.
- Token firmado para consulta de orden.
- Headers de seguridad HTTP en produccion.
- Autenticación por **Cookie de Sesión Segura** y Bearer tokens para el panel de administración.
- Bloqueo de pedidos duplicados recientes por telefono + direccion.
- Reserva/restauracion transaccional de stock en DB via RPC.
- Idempotencia en checkout para evitar doble orden por reintentos.
- Cancelacion automatica de pedidos `pending` vencidos. 
- Contrato de entorno validado contra `.env.example`, `README.md` y `docs/VARIABLES_ENTORNO.md`.

## Panel Privado Administrativo

Acceso protegido en `/panel-privado`. Inicia sesión con la clave de acceso de administrador para gestionar el catálogo y procesar envíos.

```env
# Acceso al Panel Administrativo
CATALOG_ADMIN_ACCESS_CODE=tucodigosecreto123
```
