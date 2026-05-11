## 1. UX de curación en frontend

- [x] 1.1 Añadir bloque de selección de ingredientes existentes en `menu-web/pages/recipes.vue` con búsqueda/autocompletado desde catálogo.
- [x] 1.2 Implementar alta local-first de ingredientes manuales como filas `draft-*` sin inserción inmediata en base de datos.
- [x] 1.3 Implementar acción de guardado unificado de formulario para persistir metadatos de receta y filas draft.

## 2. Reglas de consistencia y estado

- [x] 2.1 Actualizar flujo de guardado/confirmación para canonicalizar nombre desde `ingredient_id` cuando exista.
- [x] 2.2 Bloquear transición a `complete` cuando existan filas sugeridas o no confirmadas (`pending_ingredients`).
- [x] 2.3 Añadir validación de duplicados por `normalized_name` en la receta abierta antes de persistir.

## 3. Hardening en Supabase

- [x] 3.1 Crear/aplicar migración con función SQL de normalización de nombres de ingredientes.
- [x] 3.2 Añadir trigger `before insert/update` en `recipe_ingredients` para canonicalización, auto-link por normalizado y fusión en colisión.
- [x] 3.3 Ejecutar saneamiento inicial de datos existentes (normalización + deduplicación por `recipe_id, normalized_name`).

## 4. Validación y despliegue

- [x] 4.1 Probar flujo E2E: añadir manual, añadir desde catálogo, guardar formulario y refrescar receta.
- [x] 4.2 Verificar que no aparecen duplicados por mayúsculas/tildes/espacios en `recipe_ingredients`.
- [x] 4.3 Documentar cambios en `task_log.md` y preparar commit/PR con resumen funcional y técnico.
