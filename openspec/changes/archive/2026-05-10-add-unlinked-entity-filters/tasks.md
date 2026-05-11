## 1. Recipes filter (sin ingredientes)

- [x] 1.1 Añadir estado reactivo para activar/desactivar filtro de recetas sin ingredientes en `menu-web/pages/recipes.vue`.
- [x] 1.2 Incorporar el filtro en la computed/listado filtrado para mostrar solo recetas con cero ingredientes cuando esté activo.
- [x] 1.3 Añadir control UI (checkbox o botón) y texto de empty-state contextual para el caso sin resultados.

## 2. Ingredients filter (sin recetas)

- [x] 2.1 Añadir estado reactivo para activar/desactivar filtro de ingredientes sin recetas en `menu-web/pages/ingredients.vue`.
- [x] 2.2 Incorporar el filtro en la computed/listado filtrado usando enlaces receta-ingrediente para mostrar solo ingredientes huérfanos.
- [x] 2.3 Añadir control UI (checkbox o botón) y texto de empty-state contextual para el caso sin resultados.

## 3. Validación

- [x] 3.1 Verificar que la combinación con filtros existentes no rompe el comportamiento actual.
- [x] 3.2 Ejecutar `npm run lint` en `menu-web`.
- [x] 3.3 Ejecutar `npm run build` en `menu-web`.
