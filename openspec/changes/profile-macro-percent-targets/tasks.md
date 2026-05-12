## 1. Database And Types

- [ ] 1.1 Add Supabase migration for `person_profiles.protein_pct_target` with backfill from existing carbs/fat percentages.
- [ ] 1.2 Recalculate `daily_protein_target` from `daily_kcal_target` and deduced `protein_pct_target` during migration.
- [ ] 1.3 Add database constraints so profile macro percentages are valid and total exactly 100.
- [ ] 1.4 Update `types/index.ts` for `protein_pct_target` and calculated protein grams semantics.

## 2. Nutrition Utilities And Tests

- [ ] 2.1 Update `utils/nutrition/profileTargets.ts` to derive protein grams from `protein_pct_target` or deduced carbs/fat percentages.
- [ ] 2.2 Update `utils/nutrition.js` or replace config-specific helpers so macro validation uses exact 100% profile splits.
- [ ] 2.3 Add/update tests for profile target conversion, exact 100% validation, deduced protein percent, and calculated protein grams.
- [ ] 2.4 Ensure nutrition generator tests still pass with percentage-based protein targets.

## 3. Configuration UI

- [ ] 3.1 Remove or hide the editable global objectives panel from `pages/config.vue`.
- [ ] 3.2 Update profile create/edit form to edit kcal, carbs %, fat %, tolerance, and basic profile fields.
- [ ] 3.3 Show deduced protein percentage and per-profile grams summary using app-consistent cards/badges.
- [ ] 3.4 Disable or reject profile save when the deduced split is invalid or cannot total exactly 100%.
- [ ] 3.5 Persist `protein_pct_target` and calculated `daily_protein_target` when saving profiles.

## 4. Generator Compatibility

- [ ] 4.1 Verify `server/services/menuGenerator.ts` consumes calculated profile targets without requiring editable protein grams.
- [ ] 4.2 Verify existing rotating generation paths still receive `daily_protein_target` grams from profiles.
- [ ] 4.3 Update any UI display in `/generar` that still implies protein grams are manually edited.

## 5. Verification And Delivery

- [ ] 5.1 Run targeted nutrition tests.
- [ ] 5.2 Run rotating regression tests.
- [ ] 5.3 Run Nuxt build.
- [ ] 5.4 Update `task_log.md` with the change summary and validation results.
- [ ] 5.5 Commit in a dedicated branch, open PR to `main`, merge, and archive OpenSpec when implementation is complete.
