## Context

El flujo manual-first incrementa acciones de guardado/import/export/fusión y exige feedback inmediato. Los modales de importación/fusión deben cerrarse de forma consistente cuando la acción termina correctamente.

## Goals / Non-Goals

**Goals:**
- Añadir notificaciones toast globales reutilizables.
- Estandarizar mensajes de éxito/error.
- Cerrar modales de acción en éxito.

**Non-Goals:**
- No eliminar confirmaciones nativas destructivas aún.
- No crear un sistema de traducciones i18n de notificaciones en esta fase.

## Decisions

1. Usar `vue-sonner@1.x` por compatibilidad con Nuxt 3.
2. Registrar `<Toaster />` global en `app.vue`.
3. Encapsular API en composable `useAppToast` para mensajes estandarizados.
4. En `ingredients.vue` y `recipes.vue`, aplicar patrón:
   - `try`: acción + toast success + cierre modal (si aplica)
   - `catch`: `logError` + toast error + mantener modal

## Risks / Trade-offs

- [Riesgo] Duplicidad entre `formError` y toast → Mitigación: mantener `formError` solo donde aporta contexto inline y usar toast como confirmación global.
- [Trade-off] Convivencia temporal con `confirm()` nativo hasta iteración posterior.
