## Context

El flujo actual de curación en recetas carga un subconjunto local del catálogo (`ingredients`) y filtra en cliente. Este patrón no escala bien con catálogos grandes y limita resultados potenciales.

## Goals / Non-Goals

**Goals:**
- Habilitar búsqueda de ingredientes de catálogo en servidor con límite de resultados.
- Reducir carga inicial de datos en `recipes.vue`.
- Mantener compatibilidad con flujo draft local y prevención de duplicados.

**Non-Goals:**
- Implementar motor de búsqueda semántico.
- Cambiar el modelo de datos de ingredientes.

## Decisions

1. Crear endpoint GET interno (`/api/ingredients-catalog-search`) con parámetros `query` y `limit`.
2. Normalizar la query en backend y aplicar `ilike` sobre `name` y `normalized_name`.
3. En frontend, usar `watch` + debounce para consultar backend tras 2+ caracteres.
4. Mantener botón explícito de “Añadir desde catálogo”, usando match por id/nombre devuelto.

## Risks / Trade-offs

- [Riesgo] Muchas consultas por tecleo → Mitigación: debounce + mínimo de caracteres + límite de resultados.
- [Riesgo] Diferencias de normalización FE/BE → Mitigación: reutilizar normalizador existente y fallback por ambos campos.
- [Trade-off] Dependencia de red para sugerencias → Mitigación: UI de carga/errores y flujo manual sigue disponible.
