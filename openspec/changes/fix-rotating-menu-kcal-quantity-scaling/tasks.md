## 1. Diagnose Existing Calculation Path

- [x] 1.1 Trace current recipe base calculation from `recipe_ingredients` to `validRecipeById` and document where placeholder quantities enter the pipeline.
- [x] 1.2 Trace current profile multiplier calculation, including `multiplier`, density cap, `adjustedMultiplier`, persisted `serving_multiplier`, final quantities and daily totals.
- [x] 1.3 Add or update logging metadata so failed generation can report base kcal, base protein, normalized ingredient grams and multiplier inputs.

## 2. Recipe Base Validation

- [x] 2.1 Implement classification for implausible positive quantities as relative weights after unit normalization.
- [x] 2.2 Implement validation for implausibly low non-special dish `base_kcal` and macro mass.
- [x] 2.3 Ensure invalid non-positive recipe bases block while positive placeholders remain generatable with diagnostics.
- [x] 2.4 Confirm compound meals combine and validate constituent bases without hiding invalid constituent quantities.

## 3. Portion Scaling Rules

- [x] 3.1 Replace the current `0.55..2.5` clamp with a scaling policy that never scales normal ingredient quantities below base quantities.
- [x] 3.2 Calculate desired profile multipliers from kcal/protein targets using validated base kcal/protein.
- [x] 3.3 Make density/max-serving constraints diagnostic and fail generation when they prevent acceptable target fit.
- [x] 3.4 Persist the multiplier actually used for final quantities, not a different pre-adjusted multiplier.

## 4. Daily Guardrails Before Persistence

- [x] 4.1 Add day/profile kcal and protein tolerance validation before any Supabase insert.
- [x] 4.2 Account for explicitly reserved special/free kcal separately from regular meal targets.
- [x] 4.3 Return/log actionable diagnostics for day total failures, including profile, day, meals, targets, totals and deltas.
- [x] 4.4 Verify no rows are inserted when guardrails fail.

## 5. Regression Tests

- [x] 5.1 Extract pure helpers for recipe-base validation and profile portion calculation if needed for fast tests.
- [x] 5.2 Add tests for placeholder 1 g ingredient recipes becoming relative quantities instead of 409 blockers.
- [x] 5.3 Add tests that fixed/base recipe quantities are never reduced below curated quantities.
- [x] 5.4 Add tests for the reported collapsed menu pattern proving it cannot persist a 54 kcal day.
- [ ] 5.5 Add tests for successful realistic fixtures reaching configured kcal/protein tolerance for David and Lydia style profiles.

## 6. Verification

- [x] 6.1 Run targeted rotating tests from `menu-web`.
- [x] 6.2 Run `npm run build` from `menu-web`.
- [ ] 6.3 Manually verify a generated preview/detail no longer shows 1-3 g quantities for normal meals.
- [x] 6.4 Confirm OpenSpec status is complete and ready to archive.
