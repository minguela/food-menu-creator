## Why

La curación de recetas ya permite añadir ingredientes del catálogo, pero depende de una carga local limitada de ingredientes. A medida que crezca el catálogo, ese enfoque degradará rendimiento y reducirá la calidad de búsqueda.

## What Changes

- Añadir endpoint server-side para búsqueda de ingredientes de catálogo por texto normalizado.
- Sustituir en `recipes.vue` la lista local completa por búsqueda remota incremental con debounce.
- Mantener prevención de duplicados y alta como fila draft local antes de guardar.

## Capabilities

### New Capabilities
- `recipe-ingredient-server-search`: Búsqueda remota de ingredientes existentes para curación de recetas, con resultados acotados y ordenados.

### Modified Capabilities
- Ninguna.

## Impact

- Frontend: `menu-web/pages/recipes.vue` (input de búsqueda y selección).
- Backend: nuevo endpoint en `menu-web/server/api` para consulta de catálogo.
- UX/performance: menor carga inicial y mejor escalado del flujo de curación.

## Non-goals

- No implementar fuzzy matching avanzado.
- No reemplazar otros buscadores de ingredientes externos (OFF/USDA).
