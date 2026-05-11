## Why

Actualmente, al curar recetas es fácil crear ingredientes duplicados por variantes de escritura (por ejemplo `Aceite`, `aceite`, `aceite ` o con/sin tilde). Esto degrada la calidad de datos, rompe la consistencia nutricional y genera fricción en la UI de recetas.

## What Changes

- Añadir un flujo explícito para seleccionar ingredientes existentes del catálogo durante la curación de recetas.
- Forzar normalización y canonicalización al guardar ingredientes de receta para reducir duplicados por nombre.
- Definir reglas de estado de receta para que no pase a `complete` mientras existan ingredientes sugeridos/no confirmados.
- Mantener el comportamiento local-first en UI (filas draft) y persistencia en guardado de formulario/fila.

## Capabilities

### New Capabilities
- `recipe-ingredient-catalog-selection`: Permite añadir a una receta ingredientes ya existentes, con búsqueda/autocompletado, prevención de duplicados por nombre normalizado y persistencia consistente.

### Modified Capabilities
- Ninguna (no hay specs existentes en `openspec/specs/`).

## Impact

- Frontend: `menu-web/pages/recipes.vue` (curación, validaciones y guardado).
- Backend/DB: normalización y deduplicación en `recipe_ingredients` mediante migración/trigger.
- Calidad de datos: menor creación de ingredientes duplicados y mayor consistencia de nombres canónicos.
- UX: flujo de curación más rápido al reutilizar ingredientes existentes.

## Non-goals

- No rediseñar por completo la pantalla de recetas.
- No modificar el modelo nutricional ni el cálculo de macros.
- No implementar edición masiva avanzada del catálogo de ingredientes en esta tarea.
