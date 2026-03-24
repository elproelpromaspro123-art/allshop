# Storefront Hobby-like Budget

Fecha de referencia: 2026-03-24

## Contexto

Este storefront se optimiza con un techo tecnico "Hobby-like" para controlar consumo, aunque Vercel define Hobby como uso personal y no comercial. Por eso las cuotas se usan como presupuesto operativo y alerta temprana, no como recomendacion final para una tienda activa.

## Cuotas usadas como techo

- 100 GB por mes de Fast Data Transfer
- 1 M de Edge Requests por mes
- 1 M de invocaciones a Functions por mes
- 4 horas por mes de Active CPU
- 360 GB-h por mes de Provisioned Memory
- 5.000 transformaciones de imagen por mes
- 10.000 eventos por mes de Speed Insights

## Decisiones aplicadas en este rework

- Reducir polling en catalogo, stock y seguimiento en modo free-like.
- Retrasar widgets flotantes no criticos hasta idle o primera interaccion.
- Mantener senales sinteticas como apoyo secundario y no como capa dominante.
- Priorizar CTA y navegacion de compra antes que overlays decorativos.

## Riesgos que siguen bajo seguimiento

- `public/` sigue teniendo activos pesados que conviene comprimir o reemplazar.
- Video y PNGs de varios MB siguen afectando margen mensual y LCP.
- El plan Hobby no debe asumirse como destino comercial estable para produccion.
