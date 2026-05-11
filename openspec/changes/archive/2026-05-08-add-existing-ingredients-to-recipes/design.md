## Context

La curación de recetas se realiza en `menu-web/pages/recipes.vue` y hoy combina ingredientes confirmados, sugeridos y guardado incremental. El problema principal es la duplicidad semántica de ingredientes (capitalización, espacios y acentos) y la creación de ingredientes nuevos cuando ya existe uno canónico en catálogo.

Esta funcionalidad cruza frontend (UX de selección + estado local draft), base de datos (normalización y reglas de consistencia) y lógica de estado de receta (`pending_ingredients` vs `complete`).

## Goals / Non-Goals

**Goals:**
- Permitir selección directa de ingredientes existentes durante la curación de recetas.
- Garantizar persistencia consistente: añadir en local y guardar en el flujo de guardado del formulario/fila.
- Normalizar/canonicalizar en backend para prevenir duplicados por variaciones de texto.
- Impedir estado `complete` si quedan filas sugeridas/no confirmadas.

**Non-Goals:**
- Rediseñar completamente la página de recetas.
- Cambiar el modelo de nutrientes o cálculos de macros.
- Reemplazar los flujos de importación OCR externos.

## Decisions

1. **Local-first para nuevas filas manuales**
   - Decisión: `Añadir ingrediente manual` crea filas `draft-*` en memoria y no inserta en DB inmediatamente.
   - Razón: evita colisiones de unique por placeholders, mejora UX y unifica persistencia en una única acción explícita de guardado.
   - Alternativa considerada: insertar inmediatamente en `recipe_ingredients`.
     - Rechazada por fragilidad ante duplicados y acoplamiento de UI con latencia/red.

2. **Picker de catálogo en curación**
   - Decisión: añadir bloque de búsqueda/autocompletado para seleccionar ingredientes existentes y añadirlos como filas confirmadas draft.
   - Razón: reduce duplicidad y acelera curación aprovechando datos nutricionales ya curados.
   - Alternativa considerada: buscador modal avanzado con paginación y scoring.
     - Rechazada inicialmente para mantener implementación incremental.

3. **Canonicalización backend en trigger**
   - Decisión: normalizar nombre con función SQL y canonicalizar `name/normalized_name` al guardar, priorizando `ingredient_id` cuando exista.
   - Razón: blindaje transversal para UI, API y procesos batch/import.
   - Alternativa considerada: normalizar solo en frontend.
     - Rechazada por no cubrir escrituras fuera del frontend.

4. **Regla estricta de estado de receta**
   - Decisión: una receta solo puede pasar a `complete` si no existen filas sugeridas/no confirmadas.
   - Razón: evita falsos positivos de curación completa.
   - Alternativa considerada: permitir `complete` con sugeridas residuales.
     - Rechazada por inconsistencia funcional.

## Risks / Trade-offs

- [Riesgo] Catálogo grande degrada autocompletado en cliente → Mitigación: límite de carga y filtro local acotado; evolucionar a búsqueda server-side si crece.
- [Riesgo] Trigger puede ocultar conflictos de datos al hacer merge automático → Mitigación: registrar errores y conservar clave única `(recipe_id, normalized_name)`.
- [Riesgo] Diferencias de normalización FE/BE → Mitigación: alinear reglas y preferir canonicalización final en DB.
- [Trade-off] Más lógica en `recipes.vue` a corto plazo → Mitigación: posterior extracción a composables específicos de curación.

## Migration Plan

1. Aplicar migración SQL de hardening de normalización/trigger en Supabase.
2. Desplegar frontend con flujo draft + picker de catálogo + guardado unificado.
3. Verificar en QA:
   - añadir manual no escribe hasta guardar,
   - no hay duplicados por mayúsculas/tildes,
   - estado no pasa a `complete` con sugeridos pendientes.
4. Rollback:
   - frontend: revert de commit de curación,
   - DB: desactivar trigger nuevo y restaurar versión previa de función si fuese necesario.

## Open Questions

- ¿Conviene mover el autocompletado a endpoint server-side cuando el catálogo supere ~5k ingredientes?
- ¿Se debe mostrar sugerencia automática de ingrediente canónico al escribir un nombre libre similar?
