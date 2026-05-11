# rotating-menu-compound-meals

## Overview

Support compound meals (two dishes joined by `+`) in the rotating menu generation pipeline. A compound meal is stored in `weekly_meals` with a `compound_day_id` referencing `compound_day_meals`, which links two individual `dishes`. The generator must resolve the compound meal into its two constituent dishes, validate both recipes, and combine their ingredients for portion calculation.

## Requirements

### RQ-001: Load compound_day_id from weekly_meals
The generator must select `compound_day_id` when loading source meals from `weekly_meals`.

### RQ-002: Query compound_day_meals with associated dishes
The generator must load `compound_day_meals` along with their `first_dish` and `second_dish` (including recipe status, ingredients, and metadata) for all `compound_day_id`s present in the source meals.

### RQ-003: Resolve compound meals to virtual dishes
When a source meal has `compound_day_id`:
- Look up the `compound_day_meals` row.
- Retrieve both `first_dish` and `second_dish` from the dish lookup maps.
- Construct a virtual dish object that represents the compound meal.
- The virtual dish must expose the same fields as a real dish (`id`, `name`, `normalized_name`, `recipe_status`, `is_special`, `special_kcal_reserved`).
- The virtual dish must include references to both constituent dishes for downstream processing.

### RQ-004: Validate both constituent recipes
A compound meal is considered to have a valid recipe only if **both** constituent dishes have `recipe_status === 'complete'` (or `'not_required'` for special meals).

### RQ-005: Combine ingredient bases
For portion calculation and shopping lists:
- Load `recipe_ingredients` for both constituent dishes.
- Combine ingredient lists into a single flat list.
- For ingredients with the same `normalized_name`, sum their `quantity` values (assuming the same unit type; if units differ, keep them separate for now).
- The combined list is used as the `ingredientBase` for the compound meal.

### RQ-006: No regression for simple meals
Meals without `compound_day_id` must continue to work exactly as before.

### RQ-007: Compound meals in meal library
Compound meals must appear in the `mealLibrary` alongside simple meals, categorized by `meal_type` (`desayuno`, `comida`, `cena`).

## Examples

| Input weekly_meal | compound_day_meals | Resolved dishes | Valid? |
|---|---|---|---|
| dish_name: "Pescado blanco + ensalada", compound_day_id: "abc" | first_dish: "Pescado blanco", second_dish: "Ensalada" | Both found in dishes table | Yes, if both recipes complete |
| dish_name: "Arroz + pollo", compound_day_id: "def" | first_dish: "Arroz", second_dish: "Pollo" | "Pollo" recipe incomplete | No (discarded with `recipe_not_validated`) |
| dish_name: "Tortilla", compound_day_id: null | N/A | Single dish "Tortilla" | Existing behavior |
