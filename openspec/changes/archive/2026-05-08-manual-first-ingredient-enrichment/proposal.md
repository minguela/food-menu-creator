## Why

La curación automática con Open Food Facts y USDA no cubre bien ingredientes de cocina y deja demasiados registros sin cerrar. Necesitamos un flujo manual-first con trazabilidad clara, validación automática y visibilidad del debug para tomar decisiones humanas rápidas.

## What Changes

- Priorizar importación manual por CSV como fuente principal (`manual_csv`) con quality gate automático.
- Añadir clasificación interna de densidad calórica por ingrediente (`muy poco calorico`, `poco calorico`, `normal`, `calorico`, `muy calorico`).
- Exponer en UI el debug de candidatos (incluyendo `raw_payload`) para ver qué devuelve OFF/USDA por ingrediente.
- Ajustar generación rotativa para limitar escalado de cantidades cuando una receta contiene ingredientes muy calóricos.

## Capabilities

### New Capabilities
- `manual-csv-quality-gate`: Import CSV con estado `complete` solo cuando pasa validación automática; en otro caso `needs_review`.
- `ingredient-caloric-density-classification`: Etiquetado automático de densidad calórica por 100g para cada ingrediente.
- `ingredient-candidate-debug-visibility`: Visualización del payload bruto de candidatos en la UI de ingredientes.
- `rotating-quantity-caloric-guard`: Tope de multiplicador de porción para recetas con ingredientes calóricos/muy calóricos.

### Modified Capabilities
- Ninguna.

## Impact

- Backend: `menu-web/server/api/ingredients-import-csv.post.ts`, `menu-web/server/api/enrich-ingredients.post.ts`, `menu-web/server/api/rotating-menu-generate.post.ts`
- Frontend: `menu-web/pages/ingredients.vue`, `menu-web/components/IngredientCard.vue`
- DB: nueva migración para `ingredients.review_reason` y `ingredients.caloric_density_level`

## Non-goals

- No importar la base completa de Open Food Facts en Supabase.
- No eliminar OFF/USDA: se mantienen como sugerencia secundaria.
- No construir matching semántico avanzado en esta iteración.
