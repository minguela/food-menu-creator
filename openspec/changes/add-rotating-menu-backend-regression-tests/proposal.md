## Why

Los fallos de rotación por días mezclados, platos perdidos y semanas parciales son regresiones de backend que no deberían depender de pruebas manuales en el front. Según `PROJECT_CONTEXT.md`, el valor principal es generar menús rotativos fiables desde menús semanales; necesitamos tests rápidos que lo validen contra fixtures y, opcionalmente, contra Supabase real.

## What Changes

- Añadir tests backend puros para la planificación por menús semanales completos.
- Cubrir menú inicial seleccionado, primer menú aleatorio, barajado sin repetición y ciclos largos.
- Cubrir preservación de comida/cena y múltiples platos por `meal_slot`.
- Añadir validaciones testeables para detectar días incompletos antes de persistir.
- Añadir un test opcional live contra Supabase que compare `weekly_meals` reales con el rotativo generado.
- Añadir scripts npm específicos para ejecutar solo regresiones de rotación de forma ágil.

## Capabilities

### New Capabilities
- `rotating-menu-backend-regression-testing`: cobertura backend automatizada para integridad de rotación semanal completa y contraste opcional contra Supabase.

### Modified Capabilities

## Impact

- Afecta a `menu-web/tests`, `menu-web/package.json` y utilidades puras usadas por `rotating-menu-generate.post.ts`.
- Puede requerir extraer pequeñas funciones puras desde el endpoint para hacerlas testeables sin Nuxt ni Supabase.
- No añade dependencias nuevas: usa `node --test`, ya presente en el proyecto.

## Non-goals

- No sustituir pruebas E2E del front.
- No ejecutar tests live contra Supabase por defecto en CI local.
- No cambiar datos productivos durante tests live; cualquier contraste deberá ser read-only o usar generación simulada.
