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

# Email (obligatorio para validar pedidos)
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Vortixy <onboarding@resend.dev>

# Dropi (obligatorio para automatizacion)
DROPI_API_BASE_URL=https://api.dropi.co
DROPI_EMAIL=...
DROPI_PASSWORD=...
DROPI_WHITE_BRAND_ID=1
DROPI_USER_ID=
DROPI_COUNTRY=Colombia
DROPI_RATE_TYPE=NACIONAL
DROPI_DISTRIBUTION_COMPANY=SERVIENTREGA
DROPI_TYPE_SERVICE=ESTANDAR
# Opcional: mapear carrier del checkout a transportadora Dropi (JSON)
# Ejemplo: {"veloces":"INTERRAPIDISIMO","asegura_express":"SERVIENTREGA","proteccion_total":"COORDINADORA"}
DROPI_CARRIER_CODE_MAP={}

# Opcional: mapeo por slug si no guardas provider_api_url en DB
DROPI_PROVIDER_MAP_OVERRIDES={}

# Opcional: forzar envio gratis por producto (IDs o slugs separados por coma)
# Recomendado definir ambas para mantener el mismo calculo en backend y frontend.
FREE_SHIPPING_PRODUCT_IDS=
NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_IDS=
FREE_SHIPPING_PRODUCT_SLUGS=
NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_SLUGS=
```

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
7. El cliente recibe correos de estado del pedido (si `RESEND_API_KEY` esta configurada).

## Configuracion del producto para Dropi

Cada producto debe tener mapeo valido en `provider_api_url` con formato `dropi://...`.

Ejemplo:

```txt
dropi://supplier_id=123&product_id=456&warehouse_id=789&variation_id=1806779&distribution_company=SERVIENTREGA&type_service=ESTANDAR&rate_type=NACIONAL
```

Alternativa: usar `DROPI_PROVIDER_MAP_OVERRIDES` por `slug`.

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
