## Context

Las pantallas de `recipes` e `ingredients` ya tienen filtros y listados, pero no exponen de forma directa entidades huérfanas. Actualmente el usuario debe revisar manualmente filas y contar relaciones para detectar recetas sin ingredientes o ingredientes sin recetas.

El cambio afecta dos módulos frontend (`menu-web/pages/recipes.vue` y `menu-web/pages/ingredients.vue`) y reutiliza datos que ya llegan de Supabase (ingredientes por receta y enlaces receta-ingrediente). No requiere cambios de base de datos ni nuevas edge functions.

## Goals / Non-Goals

**Goals:**
- Añadir un control de filtro en recetas para mostrar solo recetas con 0 ingredientes asociados.
- Añadir un control de filtro en ingredientes para mostrar solo ingredientes con 0 recetas asociadas.
- Mantener el comportamiento actual cuando el filtro esté desactivado.
- Integrar estos filtros con el resto de filtros ya presentes sin romper la UX.

**Non-Goals:**
- Crear endpoints nuevos o migraciones SQL.
- Añadir nuevas acciones batch específicas para huérfanos.
- Replantear toda la lógica de búsqueda/ordenación existente.

## Decisions

1. **Filtro booleano por vista (checkbox) en estado local**
   - Se añadirá un estado local reactivo por página (`showOnlyWithoutIngredients`, `showOnlyWithoutRecipes`).
   - Rationale: es consistente con la petición (checkbox o botón), de bajo coste y no afecta rutas.
   - Alternativa considerada: filtro por query param en URL. Se descarta por complejidad adicional y porque no es requisito actual.

2. **Filtrado sobre dataset ya cargado, no nueva consulta dedicada**
   - Recipes: usar el recuento de ingredientes de cada receta para determinar huérfanas.
   - Ingredients: reutilizar `recipeLinksByIngredientId` (o equivalente) para detectar 0 enlaces.
   - Rationale: evita round-trips extra y mantiene implementación simple.
   - Alternativa considerada: consulta Supabase separada con agregación `count(*)`. Se descarta por sobrecoste innecesario para este alcance.

3. **Estados vacíos específicos según filtro activo**
   - Si el filtro está activo y no hay resultados, se mostrará mensaje contextual.
   - Rationale: evita confusión de "no hay datos" vs "no hay huérfanos".

## Risks / Trade-offs

- **[Riesgo] Contadores incompletos por carga parcial de relaciones** → **Mitigación**: aplicar el filtro solo sobre las mismas estructuras usadas ya por la UI para mostrar conteos.
- **[Riesgo] Interacción inesperada con filtros existentes** → **Mitigación**: componer filtros en una sola computed y cubrir casos combinados manualmente.
- **[Trade-off] Sin query param persistente** → se pierde compartibilidad de estado del filtro, pero se reduce complejidad y riesgo.

## Migration Plan

1. Implementar estados y controles de filtro en ambas páginas.
2. Ajustar computed de listado filtrado en recetas e ingredientes.
3. Actualizar textos de empty-state para filtros huérfanos.
4. Ejecutar `npm run lint` y `npm run build` en `menu-web`.
5. Despliegue normal vía flujo existente de merge a `main`.

Rollback: revertir commit de frontend; no hay migraciones ni cambios persistentes.

## Open Questions

- No hay bloqueantes funcionales. Como mejora futura, se puede evaluar persistir el estado del filtro en query params.
