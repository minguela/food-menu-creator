## 1. OpenSpec and data-path alignment

- [x] 1.1 Validate the source data path for weekly fixed meals (`weekly_meals` + `weekly_meal_ingredients` + ingredient catalog resolution) and document any normalization edge cases discovered during implementation.
- [x] 1.2 Validate this OpenSpec change before implementation and keep spec wording aligned with final behavior.

## 2. Rotating generator behavior

- [x] 2.1 Update `menu-web/server/api/rotating-menu-generate.post.ts` to load `weekly_meal_ingredients` for selected source weekly meals.
- [x] 2.2 Build a unified ingredient-base resolver that prefers explicit weekly fixed meal ingredients and falls back to curated `dish.recipe_ingredients` only when needed.
- [x] 2.3 Resolve weekly fixed meal ingredient names against `ingredients` nutrition data and propagate unresolved/incomplete nutrition diagnostics through the existing invalid-meal path.
- [x] 2.4 Replace inline profile target math in the rotating route with `profileTargetsFromProfile` and carry tolerance metadata forward in the route payload.
- [x] 2.5 Update day kcal warning validation so each profile uses its own tolerance-derived lower kcal bound instead of the global hardcoded ratio.
- [x] 2.6 Keep successful-warning behavior unchanged: structurally invalid meals still block, but kcal tolerance misses remain non-blocking warnings.

## 3. Regression tests

- [x] 3.1 Add deterministic local tests for weekly fixed meals that only have `weekly_meal_ingredients` and must still scale quantities above their base values.
- [x] 3.2 Add tolerance tests showing different `tolerance_percent` values produce different kcal warning outcomes for the same generated totals.
- [x] 3.3 Update existing rotating warning/scaling tests to assert profile-driven tolerance semantics instead of hardcoded ratio assumptions.

## 4. Verification

- [x] 4.1 Run `npm run test:rotating`.
- [x] 4.2 Run `npm run test:nutrition` if shared profile-target utilities are touched.
- [x] 4.3 Run `npm run build`.
- [ ] 4.4 Update `task_log.md` and archive the change after implementation and validation.
