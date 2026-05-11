## Context

The validation stage currently flags a meal as invalid if any macro is `<= 0`. This is too strict for legitimate foods where one macro can naturally be zero (e.g., carbs in fish).

## Goals / Non-Goals

**Goals:**
- Accept nutritionally valid low-carb meals.
- Preserve hard failures for empty/invalid meal outputs.

**Non-Goals:**
- Reworking the meal generation algorithm.

## Decisions

1. Replace `hasZeroMacros` rule with `hasNoMacroMass` rule:
   - invalid if kcal `<= 0`
   - invalid if protein+carbs+fat total `<= 0`
2. Keep existing invalid checks for:
   - no ingredients
   - nutrition pending
3. Extend invalid metadata with macro totals for easier diagnosis.

## Risks / Trade-offs

- **[Risk] Slightly looser validation accepts edge meals** → Mitigation: still require positive kcal and positive total macro mass.
- **[Trade-off] Existing alerts may trigger less often** → Mitigation: richer metadata keeps debugging quality high.
