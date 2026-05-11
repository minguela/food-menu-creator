## Context

The generator already computes `dayNutritionGuardrailViolations`. The problem is that the block logs them as failed and throws `422`, so no rows are persisted and users cannot inspect the generated menu.

## Goals / Non-Goals

**Goals:**
- Persist menus even when kcal/protein tolerance is missed.
- Return/log nutrition violations as warnings.
- Keep hard failures for invalid meals where kcal/macros/ingredients cannot be calculated.

**Non-Goals:**
- No schema changes.
- No UI redesign in this change.

## Decisions

1. Change day tolerance failures from `error/failed` to `warn/completed` logs.
2. Remove the `createError(422)` branch for day nutrition tolerance only.
3. Include warning diagnostics in the successful API response.
4. Add Playwright regression around warning semantics.

## Risks / Trade-offs

- [Risk] Users may accept low-calorie menus unknowingly -> Mitigation: diagnostics remain in response/logs and UI can display them next.
- [Risk] Truly broken meals could persist -> Mitigation: existing `invalidNormalMeals` hard validation remains blocking.
