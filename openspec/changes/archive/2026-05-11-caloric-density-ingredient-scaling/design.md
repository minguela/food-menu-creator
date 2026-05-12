## Context

The generator calculates one meal multiplier and currently applies it to every ingredient equally. This keeps ratios fixed but produces unrealistic growth: caloric-dense ingredients such as olive oil can grow at the same pace as vegetables. Ingredients already have `caloric_density_level` (`very_caloric`, `caloric`, normal/empty, low) plus `kcal_per_100g`, so the runtime has enough information to distribute extra grams more intelligently.

## Goals / Non-Goals

**Goals:**
- Keep curated/base quantities as minimums.
- Apply extra scaling using density factors.
- Make `very_caloric` ingredients grow least, `caloric` grow moderately, normal grow normally, and low-density ingredients grow most.
- Keep output deterministic and easy to test.

**Non-Goals:**
- No database migration.
- No exact macro optimizer.
- No UI redesign in this change.

## Decisions

1. Scale only the extra growth above base.

   If meal multiplier is `1`, final quantity equals base. If multiplier is `M > 1`, each ingredient receives extra growth `(M - 1) * densityFactor`, with a minimum of base quantity.

2. Use explicit density factors.

   Initial factors: `very_caloric = 0.35`, `caloric = 0.65`, `normal = 1`, `low = 1.35`. If `caloric_density_level` is missing, infer from `kcal_per_100g`.

3. Keep profile totals calculated from actual final quantities.

   After density scaling, kcal/protein/carbs/fat totals remain calculated from nutrition data and final grams.

4. Preserve warning semantics.

   If density-aware scaling leaves a profile/day under target, return menu with warnings instead of failing.

## Risks / Trade-offs

- [Risk] Low-density ingredients may grow too much visually -> Mitigation: cap factor at 1.35 for now and keep warnings.
- [Risk] Very caloric ingredients may contribute less kcal than target expects -> Mitigation: day warnings remain visible; future optimizer can refine.
