# Vortixy

Tienda Next.js enfocada en Colombia, con pedidos contra entrega y fulfillment por Dropi.

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
# Opcional: TTL del token de consulta de orden en minutos (default: 1440 = 24h)
ORDER_LOOKUP_TOKEN_TTL_MINUTES=1440
# Opcional: si no lo defines, el webhook usa ORDER_LOOKUP_SECRET
LOGISTICS_WEBHOOK_SECRET=...

# Email (obligatorio para validar pedidos)
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=Vortixy <noreply@vortixy.co>
# Opcional: TTL del codigo de verificacion por correo en minutos (default: 30)
EMAIL_CONFIRMATION_TTL_MINUTES=30

# Dropi (obligatorio para automatizacion)
DROPI_API_BASE_URL=https://api.dropi.co
# Recomendado: token generado en "Mis Integraciones" (tipo generico)
DROPI_INTEGRATION_TOKEN=...
# Si usas token de integracion, define DROPI_USER_ID para evitar dependencia de /integrations/whoiam
DROPI_USER_ID=...
# Alternativa legacy: login por correo/clave
DROPI_EMAIL=...
DROPI_PASSWORD=...
DROPI_WHITE_BRAND_ID=1
DROPI_COUNTRY=Colombia
DROPI_RATE_TYPE=NACIONAL
DROPI_TYPE_SERVICE=ESTANDAR

# Opcional: mapeo por slug si no guardas provider_api_url en DB
DROPI_PROVIDER_MAP_OVERRIDES={}

# Opcional: forzar envio gratis por producto (IDs o slugs separados por coma)
# Recomendado definir ambas para mantener el mismo calculo en backend y frontend.
FREE_SHIPPING_PRODUCT_IDS=
NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_IDS=
FREE_SHIPPING_PRODUCT_SLUGS=
NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_SLUGS=
```

Nota: el formulario de feedback de `/soporte` envia mensajes al mismo `DISCORD_WEBHOOK_URL`.

## Bootstrap rapido de DB (si esta vacia)

Si acabas de conectar Supabase y no tienes datos, ejecuta completo:

```txt
supabase_bootstrap.sql
```

Ese script crea tablas, indices, politicas RLS y carga categorias + productos iniciales con `provider_api_url` de Dropi para que checkout pueda validar mapeo.

Si usas DB existente y quieres la bandera por producto:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
```

## Flujo actual (contra entrega + verificacion por correo + Dropi)

1. El cliente confirma el pedido en checkout (contra entrega).
2. Backend valida datos de entrega, recalcula precio/envio y guarda la orden en DB.
   El envio gratis aplica solo si todos los items del pedido estan marcados como `free_shipping`.
3. Se genera un codigo de verificacion y se envia por correo con enlace de confirmacion.
4. El cliente abre el enlace e ingresa el codigo.
5. Solo cuando el codigo es valido se ejecuta `processFulfillment` hacia Dropi.
6. Se registra trazabilidad en `fulfillment_logs` y en `orders.notes`.
7. El cliente recibe correos de estado del pedido (si `SMTP_USER` y `SMTP_PASSWORD` estan configurados).
8. Webhook logistico actualiza estados automaticamente (`processing` -> `shipped` -> `delivered`).

## Configuracion del producto para Dropi

Cada producto debe tener mapeo valido en `provider_api_url` con formato `dropi://...`.

Ejemplo:

```txt
dropi://supplier_id=123&product_id=456&warehouse_id=789&variation_id=1806779&type_service=ESTANDAR&rate_type=NACIONAL
```

Alternativa: usar `DROPI_PROVIDER_MAP_OVERRIDES` por `slug`.

## Webhook logistico (actualizacion automatica de estados)

Endpoint:

```txt
POST /api/webhooks/logistics
```

Autenticacion (obligatoria en produccion):

- Header `x-webhook-secret: <LOGISTICS_WEBHOOK_SECRET>`
- o `Authorization: Bearer <LOGISTICS_WEBHOOK_SECRET>`
- Si `LOGISTICS_WEBHOOK_SECRET` no existe, se usa `ORDER_LOOKUP_SECRET`.

Payload esperado:

- Debe incluir algun campo de estado (`status`, `estado`, etc.).
- Para identificar la orden, puede enviar:
  - `order_id` (UUID local de Vortixy), o
  - guia/tracking y/o referencia de pedido externo para match por `orders.notes`.

Estados mapeados automaticamente:

- `processing` (confirmado/preparacion)
- `shipped` (enviado/en transito)
- `delivered` (entregado)
- `cancelled` (cancelado/fallido/devuelto)

Nota: el webhook registra auditoria en `fulfillment_logs` con accion `logistics_webhook`.

## Desarrollo

```bash
npm install
npm run dev
```

## Validacion

```bash
npm run lint
npm run build
```

## Seguridad implementada

- Recalculo server-side de subtotal y envio.
- Validaciones estrictas de datos de entrega antes de aceptar el pedido.
- Limitador de tasa en endpoints sensibles.
- Token firmado para consulta y confirmacion de orden.
- Headers de seguridad HTTP en produccion.
- Bloqueo de pedidos duplicados recientes por telefono + direccion.
- Limite de intentos del codigo de verificacion por correo.
