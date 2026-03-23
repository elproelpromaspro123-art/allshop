# Instalación de Rate Limiting en Supabase

## Problema

Los logs muestran:
```
[RateLimit] DB fallback triggered: Could not find the function public.consume_rate_limit_bucket
```

Esto ocurre porque la función de rate limiting no ha sido creada en la base de datos.

## Solución

La aplicación funciona correctamente con rate limiting en memoria (fallback automático), pero para habilitar rate limiting persistente entre instancias:

### Opción 1: SQL Editor en Supabase Dashboard

1. Ve a tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú lateral)
4. Click en **New Query**
5. Copia y pega el contenido de `supabase/functions/rate-limit.sql`
6. Click en **Run**

### Opción 2: Usando psql

```bash
# Conectar a tu base de datos Supabase
psql -h <host> -U postgres -d postgres -f supabase/functions/rate-limit.sql
```

### Opción 3: Supabase CLI

```bash
supabase db execute --file supabase/functions/rate-limit.sql
```

## Verificación

Después de instalar, verifica que la función existe:

```sql
-- En SQL Editor de Supabase
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'consume_rate_limit_bucket';
```

Deberías ver:
```
consume_rate_limit_bucket
```

## ¿Qué pasa si NO instalo la función?

✅ **La aplicación sigue funcionando** - usa rate limiting en memoria como fallback

❌ **Limitaciones:**
- El rate limiting no se comparte entre instancias (Vercel tiene múltiples)
- Un usuario podría hacer más requests si son balanceadas a diferentes instancias
- Los límites se reinician con cada deploy

## Configuración Actual

El endpoint `/api/delivery/estimate` tiene:
- **Límite:** 120 requests por minuto
- **Scope:** Por IP
- **Fallback:** In-memory (automático)

## Archivos

- `supabase/functions/rate-limit.sql` - Función SQL para crear en Supabase
- `src/lib/rate-limit.ts` - Implementación con fallback automático
- `src/app/api/delivery/estimate/route.ts` - Endpoint que usa rate limiting

## Notas

- La función usa un algoritmo de sliding window
- Los buckets expiran automáticamente después de 1 hora
- Hay una función `cleanup_rate_limit_buckets` para limpieza manual si es necesaria
