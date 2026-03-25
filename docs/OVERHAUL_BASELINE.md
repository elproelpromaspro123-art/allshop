# Overhaul Baseline

Fecha de captura: 2026-03-25

## Estado técnico verificado
- `npm.cmd run lint`: OK
- `npm.cmd run test`: OK
- `npm.cmd run build`: OK
- Rutas generadas en build: 70
- Suite actual: 50 archivos de test, 290 tests pasando, 6 skipped

## Hotspots del código actual
- `src/app/globals.css`: 2423 líneas
- `src/app/design-system.css`: 147 líneas
- `src/app/checkout/page.tsx`: 721 líneas
- `src/components/ProductCard.tsx`: 429 líneas
- `src/components/HeaderClient.tsx`: shell principal del storefront
- `src/providers/translations.ts`: 830 líneas

## Restricciones durables
- App Router + server-first patterns
- Contraentrega como único flujo de pago
- Supabase con fallback local/mock
- Zustand como núcleo del carrito
- CSRF y rate limit ya presentes y no deben degradarse
- Worktree existente debe preservarse y el overhaul se construye encima

## Primer slice de implementación
- Shell editorial: header, footer, hero, announcement bar y search dialog
- Capa visual global: `src/app/editorial-shell.css`
- PWA base revisada: `manifest.ts` y `public/sw.js`
- Runtime hardening bajo riesgo: middleware/request metadata
