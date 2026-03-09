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
NEXT_PUBLIC_SUPPORT_EMAIL=soporte@vortixy.co

# Supabase (obligatorio para operacion real)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Seguridad (obligatorio en produccion)
ORDER_LOOKUP_SECRET=...
CSRF_SECRET=...
# Opcional: TTL del token de consulta de orden en minutos (default: 1440 = 24h)
ORDER_LOOKUP_TOKEN_TTL_MINUTES=1440

# Email (obligatorio para notificaciones de estado)
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=Vortixy <noreply@vortixy.co>

# Endpoints admin protegidos
ADMIN_BLOCK_SECRET=...

# Panel privado de catalogo operativo (obligatorio para gestion interna)
CATALOG_ADMIN_ACCESS_CODE=...
CATALOG_ADMIN_PATH_TOKEN=...

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

# Alertas de stock bajo (opcional)
LOW_STOCK_ALERTS_ENABLED=1
LOW_STOCK_ALERT_THRESHOLD=5

# Mantenimiento interno (cleanup de pendientes vencidas)
MAINTENANCE_SECRET=...
```

Nota: el formulario de feedback de `/soporte` envia mensajes al mismo `DISCORD_WEBHOOK_URL`.

## Bootstrap rapido de DB (si esta vacia)

Puedes usar una de estas dos opciones:

1) Script unico:

```txt
full_database_update.sql
```

2) Scripts separados (recomendado para mantenimiento):

```txt
sql/01_schema.sql
sql/02_seed_catalog.sql
sql/03_runtime_stock.sql
```

Esto crea esquema, RLS, indices, RPC de stock transaccional, catalogo canonico y seed de stock operativo.

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

## Validacion

```bash
npm run lint
npm run test
npm run build
```

## Seguridad implementada

- Recalculo server-side de subtotal y envio.
- Validaciones estrictas de datos de entrega antes de aceptar el pedido.
- Limitador de tasa en endpoints sensibles.
- Token firmado para consulta de orden.
- Headers de seguridad HTTP en produccion.
- Endpoints admin sensibles protegidos con `Authorization: Bearer ...` (sin secretos en query string).
- Bloqueo de pedidos duplicados recientes por telefono + direccion.
- Reserva/restauracion transaccional de stock en DB via RPC.
- Idempotencia en checkout para evitar doble orden por reintentos.
- Cancelacion automatica de pedidos `pending` vencidos (endpoint interno de mantenimiento).
