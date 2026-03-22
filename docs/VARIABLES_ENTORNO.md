# Variables de Entorno - Vortixy

## Resumen

La fuente de verdad del contrato de entorno es `config/env-contract.json`.
El script `scripts/check-env.js` usa ese contrato para:

- cargar `.env.local` en desarrollo
- validar requeridos de desarrollo o producción
- aceptar aliases legacy solo de forma temporal
- detectar divergencias entre `.env.example`, `README.md` y este documento

## Variables requeridas

### Críticas

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública de Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key pública de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role para operaciones administrativas.

### Seguridad

- `CSRF_SECRET`: secreto principal de CSRF.
- `ORDER_LOOKUP_SECRET`: firma de consulta de órdenes.
- `ORDER_HISTORY_SECRET`: firma de acceso al historial de pedidos.
- `ADMIN_BLOCK_SECRET`: protege bloqueo IP y cancelación remota.
- `MAINTENANCE_SECRET`: protege limpieza operativa de pedidos pendientes.

### Producción total

- `NEXT_PUBLIC_APP_URL`: URL canónica del sitio.
- `NEXT_PUBLIC_SUPPORT_EMAIL`: correo visible de soporte.
- `SMTP_USER`: usuario SMTP.
- `SMTP_PASSWORD`: contraseña/API key SMTP.
- `EMAIL_FROM`: remitente de correos.
- `DISCORD_WEBHOOK_URL`: webhook operativo de Discord.
- `GROQ_API`: API key del chatbot.
- `CATALOG_ADMIN_ACCESS_CODE`: código operativo del panel.
- `CATALOG_ADMIN_PATH_TOKEN`: token privado de acceso/bridge del panel.

## Variables opcionales

- `GROQ_API_KEY`: alias legacy aceptado temporalmente; el nombre canónico es `GROQ_API`.
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`: Meta Pixel.
- `NEXT_PUBLIC_USAGE_MODE`: modo de uso.
- `VPNAPI_KEY`: detección avanzada de VPN/proxy.
- `FREE_SHIPPING_PRODUCT_IDS`
- `NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_IDS`
- `FREE_SHIPPING_PRODUCT_SLUGS`
- `NEXT_PUBLIC_FREE_SHIPPING_PRODUCT_SLUGS`
- `LOW_STOCK_ALERTS_ENABLED`
- `LOW_STOCK_ALERT_THRESHOLD`
- `ORDER_LOOKUP_TOKEN_TTL_MINUTES`
- `ORDER_HISTORY_TOKEN_TTL_MINUTES`
- `NEXT_PUBLIC_SUPABASE_PLAN`
- `NEXT_PUBLIC_ECO_MODE`

## Compatibilidad y aliases

- `GROQ_API_KEY` sigue siendo leído por compatibilidad en health/chat.
- `APP_URL` sigue siendo alias de `NEXT_PUBLIC_APP_URL` para compatibilidad.
- La política actual es documentar y configurar solo los nombres canónicos.

## Verificación

```bash
# Desarrollo
npm run check-env

# Producción
$env:NODE_ENV='production'; npm run check-env
```

El script falla si:

- falta una variable requerida para el entorno actual
- una variable requerida sigue usando placeholder
- `.env.example` no contiene una variable declarada en el contrato
- `README.md` o este documento no mencionan una variable declarada en el contrato

## Checklist de deploy

- [ ] Supabase público y service role configurados
- [ ] Secretos de seguridad configurados por separado
- [ ] URL y correo de soporte de producción configurados
- [ ] SMTP configurado
- [ ] Discord configurado
- [ ] Groq configurado si el chatbot seguirá activo
- [ ] Panel privado configurado
- [ ] `npm run check-env` en verde
- [ ] `.env.local` fuera de Git
