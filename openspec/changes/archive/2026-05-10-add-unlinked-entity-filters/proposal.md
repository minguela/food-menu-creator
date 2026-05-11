## Why

En la gestión diaria faltan dos filtros de calidad de datos: ver recetas sin ingredientes y ver ingredientes que no se usan en ninguna receta. Sin esta visibilidad, depurar datos huérfanos es lento y manual.

## What Changes

- Añadir en la pantalla de recetas un filtro opcional (checkbox o botón) para mostrar solo recetas sin ingredientes asociados.
- Añadir en la pantalla de ingredientes un filtro opcional (checkbox o botón) para mostrar solo ingredientes que no estén enlazados a ninguna receta.
- Mantener compatibilidad con los filtros actuales y permitir activar/desactivar estos filtros sin recargar la página.
- Actualizar el estado vacío en ambas pantallas para indicar cuándo no hay resultados para el filtro activo.

## Capabilities

### New Capabilities
- `orphan-entity-filters`: filtros UI para localizar recetas sin ingredientes e ingredientes sin recetas.

### Modified Capabilities
- Ninguna.

## Impact

- Frontend Nuxt en `menu-web/pages/recipes.vue` y `menu-web/pages/ingredients.vue`.
- Posibles ajustes en consultas de Supabase en cliente para calcular relaciones de receta/ingrediente.
- Sin cambios de esquema de base de datos ni contratos de API.

## Non-goals

- No se implementan acciones masivas nuevas (eliminación, archivado o merge) derivadas de estos filtros.
- No se cambia la lógica de OCR, generación de menús, ni cálculo nutricional.
- No se introducen nuevas tablas, migraciones, ni endpoints backend.
