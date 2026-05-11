## 1. Load compound_day_id and compound_day_meals

- [x] 1.1 Add `compound_day_id` to the `weekly_meals` select query in `rotating-menu-generate.post.ts`
- [x] 1.2 After loading dishes, query `compound_day_meals` with `first_dish_id` and `second_dish_id` for all `compound_day_id`s present in source meals
- [x] 1.3 Build lookup maps: `compoundDayById` and `dishById`

## 2. Resolve compound meals to virtual dishes

- [x] 2.1 In the recipe matching loop (around line 700), check if `sourceMeal.compound_day_id` exists
- [x] 2.2 If compound: look up both dishes by ID, construct a virtual dish object with combined metadata
- [x] 2.3 If simple: keep existing behavior
- [x] 2.4 Virtual dish added to `dishByNormalizedName` using the source meal's dish_name

## 3. Update validation for compound meals

- [x] 3.1 After validating simple dishes, loop over virtual compound dishes in `dishByNormalizedName`
- [x] 3.2 A compound meal is valid only if both constituent dishes have valid recipes in `validRecipeById`
- [x] 3.3 If either dish is invalid, the compound meal is discarded with reason `recipe_not_validated`

## 4. Combine ingredient bases

- [x] 4.1 Use already-loaded `recipeIngredientsByRecipeId` for both constituent dishes via their valid recipes
- [x] 4.2 Flatten and sum quantities for identical ingredients by `normalized_name`
- [x] 4.3 Store the combined ingredient list in `validRecipeById` under the virtual dish's synthetic ID
- [x] 4.4 Portion calculation uses `validRecipeById.get(linkedDish.id)` which works for both simple and compound meals

## 5. Portion calculation and shopping list

- [x] 5.1 Portion multiplier logic works with combined ingredient base automatically (uses `validRecipeById`)
- [x] 5.2 Shopping list generation receives combined ingredients through `validRecipeById`
- [x] 5.3 Overlapping ingredients are summed (e.g., aceite de oliva from both dishes)

## 6. Testing and verification

- [x] 6.1 Build passes (`npm run build` completes without errors)
- [x] 6.2 Simple meals continue to work (no changes to simple meal matching logic)
- [x] 6.3 Compound meals with incomplete recipes are discarded (validation checks both constituent recipes)
- [x] 6.4 PR #36 merged to main
