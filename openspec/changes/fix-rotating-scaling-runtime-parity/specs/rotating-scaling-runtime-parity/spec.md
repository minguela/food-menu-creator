## ADDED Requirements

### Requirement: Deployed rotating runtime MUST enforce non-collapsing scaling
El runtime desplegado SHALL bloquear recetas base implausibles y SHALL evitar porciones por debajo de base para comidas normales.

#### Scenario: Placeholder recipe quantities in deployed runtime
- **WHEN** una receta normal llega con cantidades de ~1 g
- **THEN** la generacion SHALL fallar con diagnostico y SHALL NOT persistir menu

### Requirement: Deployed runtime MUST enforce day-level target guardrails
El runtime desplegado SHALL validar tolerancias minimas de kcal/proteina por perfil antes de insertar filas.

#### Scenario: Collapsed day around 54 kcal
- **WHEN** un dia calculado queda muy por debajo del objetivo (por ejemplo 54/1900)
- **THEN** el proceso SHALL devolver error de validacion y SHALL NOT persistir resultados
