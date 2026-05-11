## Why

La app muestra feedback inconsistente entre `alert`, errores silenciosos y mensajes inline. Esto complica entender si guardar/eliminar/importar/exportar/fusionar funcionó, y deja modales abiertos o cerrados sin criterio uniforme.

## What Changes

- Integrar `vue-sonner` como sistema global de notificaciones in-app.
- Reemplazar feedback de acciones CRUD principales por toasts de éxito/error.
- Definir política de modales: cerrar en éxito, mantener abiertos en error.
- Aplicar el patrón en las pantallas con más operaciones (ingredientes y recetas, más acciones transversales).

## Capabilities

### New Capabilities
- `global-toast-feedback`: notificaciones toast unificadas para operaciones de usuario.
- `modal-success-closure-policy`: cierre automático de modales tras acciones exitosas.

### Modified Capabilities
- Ninguna.

## Impact

- `menu-web/app.vue`
- `menu-web/composables/use-app-toast.ts`
- `menu-web/pages/ingredients.vue`
- `menu-web/pages/recipes.vue`
- `menu-web/package.json`

## Non-goals

- No reemplazar en esta iteración todos los `confirm()` por modal custom.
- No rediseñar visualmente toda la app.
