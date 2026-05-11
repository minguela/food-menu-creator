## 1. Backend search endpoint

- [x] 1.1 Crear `menu-web/server/api/ingredients-catalog-search.get.ts` con parámetros `query` y `limit`.
- [x] 1.2 Implementar búsqueda por `name` y `normalized_name`, ordenada y limitada.

## 2. Frontend integration

- [x] 2.1 Sustituir carga masiva local del catálogo por búsqueda remota con debounce en `menu-web/pages/recipes.vue`.
- [x] 2.2 Mostrar estados de carga/empty/error para el bloque “Añadir ingrediente existente (catálogo)”.
- [x] 2.3 Mantener acción “Añadir desde catálogo” usando resultados remotos y validación anti-duplicado.

## 3. Validation and closure

- [x] 3.1 Verificar flujo: escribir query, ver sugerencias, añadir draft y guardar.
- [x] 3.2 Marcar tareas completas y archivar el change.
