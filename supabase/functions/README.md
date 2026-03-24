# Instalación de Rate Limiting en Supabase

## Problema

Los logs muestran errores de schema en la tabla de rate limiting:
```
[RateLimit] DB error: column "window_start" does not exist
[RateLimit] DB error: null value in column "reset_at" of relation "rate_limit_buckets" violates not-null constraint
```

## Solución

La app funciona con rate limiting en memoria (fallback automático). Para habilitar rate limiting persistente entre instancias de Vercel:

### Ejecutar el SQL (OBLIGATORIO para corregir schema)

1. Ve a tu dashboard de Supabase → **SQL Editor**
2. Click **New Query**
3. Copia y pega el contenido de `supabase/functions/rate-limit.sql`
4. Click **Run**

> **Nota:** El SQL usa `CREATE TABLE IF NOT EXISTS` y `CREATE OR REPLACE FUNCTION`, así que es seguro ejecutarlo incluso si ya existe una versión anterior. Reemplazará la función automáticamente.

## Schema Canónico

Tabla: **`rate_limits`** (NO `rate_limit_buckets`)
- `key TEXT PRIMARY KEY`
- `count INTEGER NOT NULL DEFAULT 1`
- `reset_at TIMESTAMPTZ NOT NULL`

RPC: **`consume_rate_limit_bucket(key, limit, window_ms)`**
- Retorna: `{allowed, remaining, retry_after_seconds}`

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
