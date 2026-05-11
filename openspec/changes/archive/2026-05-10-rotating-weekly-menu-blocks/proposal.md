## Why

El generador rotativo actual mezcla comidas por tipo y por offset, por lo que rompe la estructura diaria de los menús semanales existentes. Según el contexto de `PROJECT_CONTEXT.md`, la rotación debe partir de menús semanales guardados y preservar días completos para que el resultado sea reconocible y útil.

## What Changes

- Generar el menú rotativo en bloques de 7 días por menú semanal fuente.
- Permitir elegir opcionalmente el menú semanal inicial y copiar sus días completos en los primeros días del rotativo.
- Si no se elige menú inicial, escoger el primer menú de forma aleatoria.
- Al llegar al día 8, usar otro menú semanal distinto; al día 15 repetir con un tercer menú.
- Elegir aleatoriamente el resto de menús sin repetir hasta haber usado todos los menús seleccionados.
- Si se agotan los menús semanales seleccionados, volver a empezar por el primer menú elegido para el rotativo.
- Mantener comida y cena del mismo día fuente juntas, sin reordenarlas ni cruzarlas con otros días.
- Dejar fuera de alcance, por ahora, nuevos ajustes de cantidades, kcal y macros.

## Non-goals

- No rediseñar el modelo de datos de menús rotativos.
- No cambiar el cálculo nutricional existente salvo lo imprescindible para mantener compatibilidad con la selección de platos.
- No rediseñar el flujo visual de `/generar`; solo añadir el control necesario para seleccionar el menú inicial.

## Capabilities

### New Capabilities
- `rotating-weekly-menu-block-generation`: generación de menús rotativos por bloques de menú semanal preservando días completos.

### Modified Capabilities

## Impact

- Afecta a `menu-web/server/api/rotating-menu-generate.post.ts` y `menu-web/pages/generar.vue`.
- Añade tests del orden de selección de comidas por bloques semanales y de la preferencia de menú inicial.
- No requiere migraciones ni nuevas dependencias.
