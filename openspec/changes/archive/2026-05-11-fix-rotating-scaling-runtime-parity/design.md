## Context

Hay dos arboles de app (`/` y `menu-web/`). El fix de escalado se quedo en `menu-web/`, pero los sintomas en ejecucion (`x2.50`, ~54 kcal/dia) confirman que el runtime activo no lo usa.

## Goals / Non-Goals

**Goals:**
- Llevar al arbol raiz exactamente las reglas de escalado y validacion anti-colapso.
- Asegurar que tests/build raiz validan el comportamiento corregido.

**Non-Goals:**
- No redisenar el algoritmo nutricional completo.
- No tocar migraciones.

## Decisions

1. Aplicar paridad de codigo en runtime raiz (`server/`, `utils/`, `tests`).
2. Mantener cantidades base como minimo (sin downscale < base).
3. Fallar antes de persistir cuando el dia queda fuera de tolerancia kcal/proteina.
4. Verificar con `npm run test:rotating` y `npm run build` en raiz.

## Risks / Trade-offs

- [Risk] Puede bloquear generacion con recetas mal curadas -> Mitigation: diagnostico explicito con motivo e ingrediente.
- [Risk] Diferencias residuales entre arboles -> Mitigation: mantener archivos de escalado en `utils/` raiz y cubrir con tests.
