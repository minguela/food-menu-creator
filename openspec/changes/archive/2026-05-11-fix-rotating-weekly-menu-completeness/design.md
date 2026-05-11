## Context

`menu-web/server/api/rotating-menu-generate.post.ts` ya usa `buildRotatingWeeklyMenuBlocks`, pero la integridad se pierde después por dos motivos: `weekly_meals.meal_slot` no se selecciona ni se persiste, y `rotating_menu_meals` solo permite un registro por `rotating_menu_day_id + meal_type`. Además, el endpoint elimina duplicados por `meal_type` antes de guardar, lo que descarta platos cuando un día fuente tiene varios platos en comida o cena.

## Goals / Non-Goals

**Goals:**

- Tratar cada menú semanal como la unidad mínima de rotación.
- Preservar todos los platos de cada día fuente, incluyendo `meal_slot`.
- Mantener aleatoriedad sin repetición hasta agotar menús semanales seleccionados.
- Bloquear generación cuando la validación de recetas deje un día fuente incompleto.
- Dejar trazabilidad suficiente para comparar menú generado contra `weekly_meals` en Supabase.

**Non-Goals:**

- Cambiar OCR, edición de menús semanales o curación de recetas.
- Rediseñar la estrategia de kcal/macros/cantidades.
- Rellenar platos faltantes desde otros días o menús.

## Decisions

1. Propagar `meal_slot` como dato estructural obligatorio con valor por defecto `1`.

   Alternativa considerada: concatenar platos en un único registro por franja. Se descarta porque rompería recetas, lista de compra y cantidades por plato.

2. Migrar `rotating_menu_meals` para permitir unicidad por `(rotating_menu_day_id, meal_type, meal_slot)`.

   Alternativa considerada: eliminar completamente la restricción única. Se descarta porque perdería protección contra duplicados accidentales.

3. Reemplazar la deduplicación silenciosa por una validación de integridad antes de persistir.

   Alternativa considerada: guardar lo disponible y avisar. Se descarta porque el usuario necesita menús semanales completos y el fallo parcial es más dañino que un error claro.

4. Comparar slots esperados contra slots planificados usando claves `source_weekly_menu_id:source_day_number:meal_type:meal_slot:dish_name`.

   Alternativa considerada: comparar solo conteos por día. Se descarta porque no detecta sustituciones de platos.

5. Mantener el algoritmo de orden de menús: primer menú elegido si existe; si no, primer menú aleatorio; resto barajado sin repetición; repetir el ciclo solo al agotarse.

   Alternativa considerada: orden secuencial por `week_number`. Se descarta porque el requisito confirmado es aleatorio por menús semanales completos.

## Risks / Trade-offs

- [Risk] Menús antiguos generados no tienen `meal_slot` -> Mitigation: migración con default `1` y lectura tolerante.
- [Risk] La validación puede bloquear generaciones que antes salían parciales -> Mitigation: devolver diagnóstico con día fuente, franja, slot y motivo.
- [Risk] Cambiar la restricción única puede afectar código que asume un plato por franja -> Mitigation: revisar detalle, shopping y vistas para ordenar por `meal_type + meal_slot`.
- [Risk] Más registros en `rotating_menu_meals` incrementan trabajo de lista de compra -> Mitigation: ya se procesan por comida; el crecimiento es proporcional a platos reales.

## Migration Plan

1. Añadir columna `meal_slot smallint not null default 1` a `rotating_menu_meals`.
2. Eliminar `unique_rotating_day_meal`.
3. Crear `unique_rotating_day_meal_slot` sobre `(rotating_menu_day_id, meal_type, meal_slot)`.
4. Crear índice de orden/consulta sobre `(rotating_menu_day_id, meal_type, meal_slot)`.
5. Desplegar código que lee, valida y escribe `meal_slot`.
6. Rollback: revertir código; mantener columna es compatible si la restricción anterior no se restaura hasta confirmar ausencia de datos con slots múltiples.

## Open Questions

No quedan preguntas abiertas: la rotación confirmada es aleatoria sin repetición por menús semanales completos, con menú inicial opcional fijo solo para el primer bloque.
