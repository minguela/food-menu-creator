## Why

El generador rotativo actual no garantiza que los menús semanales se conserven como bloques completos. Según `PROJECT_CONTEXT.md`, la rotación debe partir de menús semanales guardados; ahora se pueden perder platos por `meal_type`, mezclar días o generar semanas parciales aunque Supabase tenga el menú semanal completo.

## What Changes

- Generar cada bloque de 7 días desde un único menú semanal fuente completo.
- Mantener la aleatoriedad de menús semanales sin repetir hasta agotar todos los seleccionados.
- Si el usuario escoge menú inicial, fijarlo solo como primer bloque y barajar el resto sin repetición.
- Preservar `weekly_menu_id`, `day_number`, `meal_type` y `meal_slot` desde `weekly_meals` hasta `rotating_menu_meals`.
- Permitir varios platos en la misma franja de un día mediante `meal_slot` en el menú rotativo.
- Bloquear la generación con diagnóstico si tras validación falta cualquier plato esperado del día fuente.
- Contrastar la estructura generada contra los menús semanales completos de Supabase antes de persistir.

## Capabilities

### New Capabilities
- `rotating-weekly-menu-completeness`: generación rotativa por bloques completos de menús semanales, preservando todos los platos y slots.

### Modified Capabilities

## Impact

- Afecta a `menu-web/server/api/rotating-menu-generate.post.ts`, `menu-web/utils/rotating-weekly-menu-blocks.js`, `menu-web/server/api/rotating-menu-detail.get.ts` y vistas que muestran menús rotativos.
- Requiere migración Supabase para soportar `meal_slot` en `rotating_menu_meals` y ajustar su restricción única.
- Afecta a la lista de la compra solo para preservar relaciones de comidas; no cambia su algoritmo de consolidación.

## Non-goals

- No rediseñar la UI de generación salvo los mensajes/diagnósticos imprescindibles.
- No cambiar el cálculo nutricional, escalado de cantidades ni reglas de comidas libres.
- No modificar el flujo OCR ni la carga de menús semanales.
