## Context

`menu-web/server/api/rotating-menu-generate.post.ts` ya genera y persiste menús rotativos multi-perfil. La selección actual construye opciones por tipo de comida y aplica offsets independientes, lo que permite que la comida de un día provenga de una semana y la cena de otra.

## Goals / Non-Goals

**Goals:**
- Preservar días completos del menú semanal fuente durante la generación rotativa.
- Permitir que el usuario seleccione opcionalmente qué menú semanal debe ocupar el primer bloque de 7 días.
- Cambiar de menú semanal cada 7 días del rotativo.
- Elegir aleatoriamente el resto de menús fuente sin repetir hasta agotar todos los menús disponibles.
- Reutilizar el ciclo completo de menús fuente cuando la duración supera los menús disponibles.
- Mantener la persistencia y el cálculo nutricional actual sobre los platos seleccionados.

**Non-Goals:**
- Recalcular cantidades, kcal o macros con una nueva estrategia.
- Cambiar tablas Supabase o contratos de respuesta.
- Rediseñar la UI de selección de menús más allá de añadir el selector de menú inicial.

## Decisions

- Crear una función pura de planificación que, dado un conjunto de comidas semanales, una lista de IDs fuente y un ID inicial opcional, devuelva las comidas por día del rotativo. Esto permite testear la rotación sin depender de Supabase ni Nuxt.
- Agrupar comidas válidas por `weekly_menu_id` y `day_number`, no por `meal_type`. Así comida y cena del día 1 del menú fuente permanecen juntas en el día 1 del rotativo.
- Si `initialWeeklyMenuId` está presente y pertenece a los menús seleccionados con comidas válidas, colocarlo como primer bloque. Si no está presente, elegir aleatoriamente el primer menú.
- Barajar los menús restantes y anexarlos después del inicial. Esto permite secuencias como `4, 2, 1, 3` y evita repetir un menú hasta haber usado todos los seleccionados.
- Cuando se completa el ciclo de menús, repetir el mismo orden de ciclo desde el primer menú elegido. Esto mantiene predecible la continuidad para duraciones largas.
- Filtrar cada comida dentro del pipeline actual de validación antes de incluirla en la planificación. Así no se relajan las garantías existentes sobre recetas curadas, especiales e ingredientes.

## Risks / Trade-offs

- Si un menú semanal tiene días incompletos, esos días se generarán con las comidas disponibles de ese mismo día. Mitigación: no sintetizar ni mezclar con otros días para cumplir la regla de preservar días completos.
- El orden aleatorio debe ser testeable aunque use aleatoriedad en producción. Mitigación: inyectar una función RNG o un orden explícito en la función pura durante los tests.
- Si el menú inicial elegido queda sin comidas válidas tras la validación, no puede ocupar el primer bloque. Mitigación: ignorarlo y caer al comportamiento aleatorio entre menús con comidas válidas, registrando el caso en logs/metadata.
- La función pura duplica una pequeña parte de estructura de selección. Mitigación: encapsular solo el orden de origen, dejando cantidades y persistencia en el endpoint existente.

## Migration Plan

No hay migraciones. El payload de generación añadirá un campo opcional `initialWeeklyMenuId`; al ser opcional no rompe llamadas existentes. El despliegue es un cambio de código en `menu-web`; rollback con revert de rama/commit si fuese necesario.

## Open Questions

No quedan preguntas abiertas para este primer paso. Cantidades, kcal y macros se abordarán en un cambio posterior.
