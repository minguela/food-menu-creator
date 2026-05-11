## Context

El equipo pasa a un modelo manual-first de curación nutricional. La UI actual de ingredientes contiene controles de enriquecimiento automático (OFF/USDA) que generan ruido para este modo operativo.

## Goals / Non-Goals

**Goals:**
- Reducir interfaz a operaciones manuales clave.
- Mejorar ciclo CSV (import + export) para trabajo con ChatGPT.
- Añadir `english_name` para facilitar búsqueda USDA cuando se use.
- Permitir fusión explícita de ingredientes seleccionados, conservando relaciones de recetas.

**Non-Goals:**
- No implementar matching automático avanzado de duplicados.
- No modificar pipeline OCR ni menús fijos.

## Decisions

1. Import CSV pasa a modal para limpiar layout principal.
2. Export CSV se ofrece como botón directo, con columnas nutricionales clave.
3. Fusión será manual: usuario selecciona varios ingredientes y elige destino.
4. En fusión, se reasignan `recipe_ingredients` al destino y se eliminan origen.
5. `source` deja de mostrarse en tarjeta para simplificar UX.
6. Se retiran acciones OFF/autocompletar/restaurar por no ser parte del flujo actual.

## Risks / Trade-offs

- [Riesgo] Menos automatización visible para usuarios avanzados → Mitigación: endpoints siguen existiendo y se pueden reactivar en iteraciones futuras.
- [Riesgo] Fusión manual incorrecta → Mitigación: confirmación explícita y elección obligatoria de destino.
- [Trade-off] Menos acciones rápidas en tarjeta, más foco y menos errores operativos.
