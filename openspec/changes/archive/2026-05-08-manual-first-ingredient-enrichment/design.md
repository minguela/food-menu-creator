## Context

El proyecto necesita cerrar más ingredientes con un flujo confiable y auditable. OFF/USDA aportan señales útiles, pero su cobertura para cocina real es irregular. Se adopta una estrategia manual-first, con validación y ayudas de observabilidad.

## Goals / Non-Goals

**Goals:**
- CSV manual como vía principal de curación.
- Política de estado acordada: import manual entra en `complete` cuando pasa validación automática; si no, `needs_review`.
- Mostrar debug de respuesta externa por ingrediente para facilitar revisión manual.
- Introducir etiqueta de densidad calórica y usarla para moderar cantidades en menú rotativo.

**Non-Goals:**
- No ingestión masiva de la BBDD completa de OFF.
- No reemplazar por completo los pipelines de sugerencias externas.

## Decisions

1. Guardar `source=manual_csv` en import CSV y aplicar quality gate sobre macros/kcal.
2. Añadir `review_reason` para explicar por qué un ingrediente queda en `needs_review`.
3. Añadir `caloric_density_level` con umbrales:
   - `<50`: `very_low`
   - `50-99`: `low`
   - `100-200`: `normal`
   - `201-400`: `caloric`
   - `>400`: `very_caloric`
4. En generación rotativa, limitar multiplicador máximo de porción:
   - receta con `very_caloric`: cap 1.35
   - receta con `caloric`: cap 1.7
   - resto: cap 2.5

## Risks / Trade-offs

- [Riesgo] Clasificación simplificada puede ser conservadora en ciertas recetas → Mitigación: caps ajustables por configuración futura.
- [Riesgo] Más ingredientes en `needs_review` iniciales por validación estricta → Mitigación: mejor trazabilidad y workflow manual enfocado.
- [Trade-off] Menor automatización total, mayor control humano.
