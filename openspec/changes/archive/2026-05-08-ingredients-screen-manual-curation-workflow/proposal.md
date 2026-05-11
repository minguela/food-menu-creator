## Why

La pantalla de ingredientes está orientada a curación automática y mezcla demasiadas acciones que no encajan con el nuevo flujo manual-first. Se necesita simplificar la UX, añadir nombre en inglés para USDA, habilitar fusión manual controlada y mejorar import/export CSV para iterar con ChatGPT.

## What Changes

- Cambiar importación CSV a flujo con botón + modal para pegar CSV.
- Eliminar del buscador/filtros la sección de fuentes, enriquecer y mapear alias.
- Añadir `english_name` en ingredientes para búsquedas/curación en inglés (USDA).
- Reemplazar fusión automática por fusión manual de seleccionados con receta destino explícita.
- Ocultar `source` en tarjetas de ingrediente y retirar acciones de curación OFF/autocompletar/restaurar.
- Añadir exportación CSV de ingredientes desde la UI.

## Capabilities

### New Capabilities
- `ingredients-csv-modal-import-export`: importación por modal y exportación de tabla a CSV.
- `ingredients-manual-selected-merge`: fusión manual de ingredientes seleccionados hacia un destino.
- `ingredients-english-name-field`: soporte de nombre en inglés para ingredientes.

### Modified Capabilities
- Ninguna.

## Impact

- `menu-web/pages/ingredients.vue`
- `menu-web/components/IngredientCard.vue`
- Nuevos endpoints `menu-web/server/api/ingredients-export-csv.get.ts` y `menu-web/server/api/ingredients-merge-selected.post.ts`
- Migración Supabase para `ingredients.english_name`

## Non-goals

- No reactivar auto-curación OFF en esta iteración.
- No cambiar lógica de expansión OCR en el mismo cambio.
