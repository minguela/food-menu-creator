## Context

`menu-web/server/api/rotating-menu-generate.post.ts` builds recipe bases from confirmed `recipe_ingredients.quantity`, computes `base_kcal/base_protein`, then scales each generated meal per profile. The reported output shows all meals capped at `x2.50`, but the base quantities are already around 1 g per ingredient, so the final day totals are only 54 kcal against 1400-1900 kcal targets.

Current failure modes:

- `base_kcal` can be tiny because recipe ingredient quantities are accepted as valid as long as they are positive and convertible.
- Scaling is clamped to `2.5`, so bad recipe bases become tiny final quantities instead of failing.
- `serving_multiplier` persists the unclamped multiplier while ingredient quantities use `adjustedMultiplier`, making diagnostics misleading.
- Daily validation only checks positive kcal/macros, not whether totals are remotely close to targets.
- Fixed/base meal quantities are not explicitly protected as an invariant.

## Goals / Non-Goals

**Goals:**

- Preserve confirmed recipe quantities as fixed/base quantities; never scale below base for normal meals.
- Detect implausible recipe bases before persistence, including per-ingredient gram floors and dish kcal floors.
- Replace the blind `0.55..2.5` clamp with explicit scaling policy: base minimum, profile target attempt, realistic max, and hard failure if target cannot be reached.
- Validate generated daily profile totals against kcal/protein targets with clear diagnostics.
- Add deterministic tests for the reported class of failure.

**Non-Goals:**

- No database schema changes.
- No automatic mutation of recipe curation data during generation.
- No guarantee that every generated day exactly equals target kcal; acceptable tolerance is enough.

## Decisions

1. Validate recipe bases before scaling.

   A normal recipe SHALL be rejected if its confirmed ingredient base is implausible. Initial thresholds should be conservative: no gram-normalized ingredient below 5 g unless unit is inherently count-based, no total dish base below 50 kcal, and no non-special complete recipe with zero meaningful macro mass.

   Alternative considered: let the multiplier compensate. Rejected because a 1 g recipe base requires multipliers in the hundreds and creates unusable shopping lists.

2. Separate base quantities from profile scaling.

   The base recipe is the fixed minimum. Profile scaling may increase quantities, but generated `final_quantity` SHALL be at least `base_quantity` for every normal ingredient. If a meal is a fixed/special meal, its reserved kcal path remains separate and does not fabricate ingredients.

   Alternative considered: allow downscaling for lower-kcal profiles. Rejected because the user explicitly made fixed quantities non-negotiable.

3. Replace clamp-only scaling with validated target fitting.

   Compute the desired multiplier from kcal/protein targets, apply base minimum `>= 1`, apply density safeguards only as warnings/soft diagnostics, and then validate daily totals. If the configured max multiplier prevents acceptable totals, generation SHALL fail with diagnostic details instead of saving a broken menu.

   Alternative considered: increase max cap to a larger constant. Rejected because it hides bad recipe bases and still gives unpredictable results.

4. Add day-level nutrition guardrails before persistence.

   Before inserting rows, check each profile day total. A regular day with normal meals SHALL fail if total kcal is below 80% of target or protein below 75% of target, unless all shortfall is explicitly reserved as special/free kcal.

   Alternative considered: show warnings only. Rejected because persisted broken menus are worse than actionable generation failure.

5. Extract testable pure helpers if needed.

   Keep the production endpoint minimal, but extract recipe-base validation and portion calculation into utility functions if tests would otherwise require Nuxt/Supabase setup.

## Risks / Trade-offs

- [Risk] Existing curated recipes with placeholder quantities will start blocking generation -> Mitigation: diagnostics must list dish, ingredient, base grams, base kcal and required correction.
- [Risk] Some legitimate low-kcal side dishes may fail the 50 kcal floor -> Mitigation: thresholds should evaluate compound/day context and can allow side dishes if the full meal/day still reaches targets.
- [Risk] Protein targets may be impossible for a selected menu -> Mitigation: fail with a target-fit diagnostic instead of silently producing wrong macros.
- [Risk] Tight guardrails may require recipe data cleanup before generation works -> Mitigation: this is intentional; bad input should not produce fake menus.

## Migration Plan

No database migration is expected. Deploy code and tests, then regenerate affected rotating menus. Rollback is code-only by reverting the endpoint/util changes.

## Open Questions

- Confirm final tolerance thresholds during implementation after checking current fixture data. Starting proposal: kcal >= 80% of target and protein >= 75% of target for non-free regular days.
