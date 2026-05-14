## Context

`menu-web/server/api/rotating-menu-generate.post.ts` currently reads `weekly_meals`, links them to reusable `dishes`, and scales ingredient quantities from curated recipe ingredients. However, weekly fixed meals created directly in the weekly menu editor store their base quantities in `weekly_meal_ingredients`, and that table is not currently loaded by the rotating generator. As a result, recurring weekly breakfasts/comidas/cenas can miss the scaling path or behave as if they had no adjustable base ingredients.

The same route also computes profile targets inline and validates day kcal shortfalls through hardcoded ratios. That diverges from the newer shared profile-target model introduced for the nutrition generator, where each profile owns its own `tolerance_percent`.

## Goals / Non-Goals

**Goals**
- Make weekly fixed meals with `weekly_meal_ingredients` participate in rotating quantity scaling.
- Keep curated weekly ingredient quantities as the minimum/base portion before any multiplier increase.
- Align rotating kcal warning behavior with each selected profile's tolerance.
- Reuse shared nutrition target logic so rotating generation and scored generation do not drift.

**Non-Goals**
- No new persistence tables.
- No rewrite of the rotating detail UI unless warning metadata needs a minimal display adjustment.
- No broad optimization rewrite of the rotating route beyond the touched scaling/tolerance path.

## Decisions

1. **Weekly meal ingredients become the first rotating base when present**
   - For each source `weekly_meals` row, load associated `weekly_meal_ingredients`.
   - If a source weekly meal has explicit weekly ingredients, use that collection as the ingredient base for scaling and nutrition.
   - Fall back to linked `dish.recipe_ingredients` only when the weekly meal has no explicit weekly ingredient rows.
   - Rationale: the weekly menu editor is the user's most specific source of truth for fixed recurring meals.

2. **Weekly ingredient rows must resolve to nutrition through the ingredient catalog**
   - Because `weekly_meal_ingredients` store names and quantities, the generator should normalize names and resolve them against `ingredients` for kcal/macros.
   - If a weekly ingredient cannot be resolved or lacks complete nutrition, generation should surface the same style of diagnostics currently used for incomplete recipe nutrition.
   - Rationale: scaling without nutrition would recreate the same hidden mismatch problem.

3. **Profile targets must come from `profileTargetsFromProfile`**
   - Replace route-local kcal/macro target calculation with the shared utility already used by the nutrition generator.
   - Carry forward `targetKcal`, macro grams, `tolerancePercent`, and lower/upper bounds in the rotating route's internal profile target objects.
   - Rationale: one source of truth for tolerance and macro math avoids future drift.

4. **Daily kcal warnings use profile-specific lower bounds**
   - Replace the flat `MIN_KCAL_TARGET_RATIO` warning threshold with `profile.bounds.kcal.min` or its equivalent ratio derived from the selected profile tolerance.
   - Preserve the current non-blocking warning model and existing structural-invalid-meal blockers.
   - Protein guardrails may remain unchanged unless implementation shows they must share the same bound object for consistency.
   - Rationale: the user requirement explicitly says daily kcal tolerance should respect the requirements configured per profile.

5. **Regression coverage must prove both fixes together**
   - Add deterministic tests where a weekly fixed meal exists only through `weekly_meal_ingredients` and still gets scaled.
   - Add strict-vs-relaxed profile tests showing the same generated day can warn for one profile and pass for another based on `tolerance_percent`.
   - Rationale: both bugs are easy to reintroduce because they live in route orchestration rather than isolated UI code.

## Risks / Trade-offs

- **Weekly ingredient name resolution may be ambiguous** -> Mitigation: normalize names, log unresolved ingredients explicitly, and block only the affected normal meal portions as invalid/nutrition-pending.
- **Shared utility adoption may change current rounding subtly** -> Mitigation: update tests to assert the intended rounded bounds and deltas.
- **Existing warning tests assume hardcoded ratios** -> Mitigation: rewrite them around profile tolerance semantics instead of magic constants.

## Migration Plan

1. Extend source meal loading to include `weekly_meal_ingredients` and any ingredient-catalog lookup needed for nutrition.
2. Extract/normalize a single ingredient-base builder that can work from weekly-meal ingredients or recipe ingredients.
3. Replace inline profile math with `profileTargetsFromProfile` in the rotating route.
4. Update day warning validation to compare kcal totals against profile-derived tolerance minima.
5. Expand tests, run rotating/nutrition/build verification, and validate the OpenSpec change.

## Open Questions

- Should protein warnings also move fully to profile-derived tolerance bounds in this same change, or remain on the current relaxed minimum floor until separately specified?
- If a weekly fixed meal ingredient name matches multiple catalog ingredients after normalization, should the generator hard-fail, pick an exact canonical match only, or require prior curation?
