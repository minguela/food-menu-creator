## Why

El fix anterior de escalado se aplico en `menu-web/`, pero el runtime activo sigue leyendo el arbol raiz (`server/`, `utils/`, `tests/`). Por eso produccion sigue mostrando `x2.50` y cantidades de 1-3 g.

## What Changes

- Alinear el runtime real con el fix de escalado y validaciones anti-colapso kcal.
- Aplicar la misma logica de validacion de receta base, multiplicador minimo >= 1 y guardrails diarios en el arbol raiz.
- Añadir pruebas en el arbol raiz para cubrir el patron de 54 kcal y cantidades simbolicas.

## Capabilities

### New Capabilities
- `rotating-scaling-runtime-parity`: Garantiza que el codigo desplegado usa las mismas reglas de escalado y bloqueo que el plan OpenSpec aprobado.

### Modified Capabilities

## Impact

- Archivos raiz: `server/api/rotating-menu-generate.post.ts`, `utils/`, `tests/`, `package.json`.
- Sin cambios de schema DB.

## Non-goals

- No cambios de UI.
- No backfill de menús ya generados; hay que regenerar tras desplegar.
