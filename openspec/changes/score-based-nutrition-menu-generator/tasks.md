## 1. Database And Types

- [x] 1.1 Add Supabase migration for `person_profiles.tolerance_percent` with default and check bounds.
- [x] 1.2 Add Supabase migration for recipe metadata on `dishes` if missing: `meal_type`, `servings`, and `tags`.
- [x] 1.3 Add Supabase migration for generated day scoring metadata: `score`, `meets_targets`, and diagnostics JSON on the chosen generated-menu day table.
- [x] 1.4 Update `types/index.ts` for profile tolerance, recipe metadata, generated scoring fields, and snack meal type where supported.

## 2. Shared Nutrition Utilities

- [x] 2.1 Create `utils/nutrition/calculateRecipeMacros.ts` to calculate recipe macros from confirmed ingredients and complete per-100g nutrition.
- [x] 2.2 Create `utils/nutrition/profileTargets.ts` to convert profile kcal/protein/carbs/fat/tolerance into validated daily targets.
- [x] 2.3 Create `utils/nutrition/menuScoring.ts` for score calculation, protein-shortfall penalty, deviations, and tolerance compliance.
- [x] 2.4 Replace duplicated macro math in new code paths with the shared utilities and document any existing rotating-generator duplication left for a later refactor.

## 3. Unit Tests And Fixtures

- [x] 3.1 Add local fixtures for 3 breakfasts, 5 lunches, 5 dinners, 2 snacks, and realistic ingredient nutrition.
- [x] 3.2 Add tests for recipe macro calculation from ingredient quantities.
- [x] 3.3 Add tests for profile target conversion and invalid percentage/tolerance validation.
- [x] 3.4 Add tests for scoring, protein shortfall penalty, and tolerance compliance.
- [x] 3.5 Add tests for best-combination selection and serving multiplier scaling.

## 4. Generator Service

- [x] 4.1 Create `server/services/menuGenerator.ts` with typed inputs and outputs for daily, weekly, and monthly generation.
- [x] 4.2 Load candidate recipes from `dishes`, `recipe_ingredients`, and `ingredients`, excluding incomplete candidates with diagnostics.
- [x] 4.3 Separate candidates by `meal_type` and support breakfast, lunch, dinner, and optional snack.
- [x] 4.4 Implement bounded deterministic daily combination search with candidate limits and serving multipliers `[0.75, 1, 1.25, 1.5]`.
- [x] 4.5 Implement repetition penalties and period summaries for weekly/monthly generation.
- [x] 4.6 Add useful non-noisy logs for candidate counts, excluded recipes, selected scores, and tolerance misses.

## 5. API And Persistence

- [x] 5.1 Add `POST /api/nutrition-menu-generate` for preview generation without invented macros.
- [x] 5.2 Add save behavior via `POST /api/nutrition-menu-save` or a clearly documented combined generate-and-save route.
- [x] 5.3 Add `GET /api/nutrition-menu-detail` to return days, meals, totals, deviations, score, and compliance status.
- [x] 5.4 Add `GET /api/nutrition-menu-shopping-list` to aggregate scaled ingredients and format grams/kg.
- [x] 5.5 Ensure API errors distinguish invalid profile input, insufficient candidates, and incomplete recipe nutrition.

## 6. UI Integration

- [ ] 6.1 Update `pages/config.vue` to edit/display profile tolerance without breaking existing profile creation.
- [ ] 6.2 Update `pages/generar.vue` to support the scored generator flow while preserving the existing rotating-menu flow.
- [ ] 6.3 Display selected profile targets, tolerance, generated days, meals, multipliers, macro deviations, compliance state, and score.
- [ ] 6.4 Add save action for generated previews and navigation to generated menu detail.
- [ ] 6.5 Update detail/shopping UI as needed to show generated menu scores and aggregated shopping quantities.

## 7. Verification

- [ ] 7.1 Run targeted nutrition generator tests locally.
- [ ] 7.2 Run existing rotating/menu/shopping tests to check for regressions.
- [ ] 7.3 Run Nuxt typecheck/build or the repository test command if time permits.
- [ ] 7.4 Manually verify the expected flow: profile, curated recipes, daily generation, save, detail, and shopping list.
