## Purpose
Support compound meals (two dishes joined by `+`) in the rotating menu generation pipeline.

A compound meal is stored in `weekly_meals` with a `compound_day_id` referencing `compound_day_meals`, which links two individual `dishes`. The generator resolves the compound meal into its two constituent dishes, validates both recipes, and combines their ingredients for portion calculation.

## Requirements

### Requirement: Generator MUST load compound meal references
The generator SHALL select `compound_day_id` when loading source meals from `weekly_meals`.

#### Scenario: Source meal has compound_day_id
- **WHEN** a source `weekly_meals` row references a compound day meal
- **THEN** the loaded source meal SHALL include its `compound_day_id`

### Requirement: Generator MUST load compound meal dish data
The generator SHALL load `compound_day_meals` and associated `first_dish` and `second_dish` data for every referenced compound meal.

#### Scenario: Compound meal reference is present
- **WHEN** loaded source meals include one or more `compound_day_id` values
- **THEN** the generator SHALL query the referenced compound rows with both associated dishes and their recipe metadata

### Requirement: Generator MUST resolve compound meals to virtual dishes
The generator SHALL resolve each compound source meal to a virtual dish containing both constituent dishes and the fields expected by downstream processing.

#### Scenario: Compound meal can be resolved
- **WHEN** a source meal has `compound_day_id` and both constituent dishes exist
- **THEN** the generator SHALL construct a virtual dish with `id`, `name`, `normalized_name`, `recipe_status`, `is_special`, `special_kcal_reserved`, and constituent dish references

### Requirement: Compound recipe validity MUST require both recipes
A compound meal SHALL be considered recipe-valid only when both constituent dishes have valid recipe status.

#### Scenario: One constituent recipe is incomplete
- **WHEN** a compound meal contains one dish with incomplete recipe status
- **THEN** the compound meal SHALL be treated as not recipe-valid

### Requirement: Compound ingredient bases MUST combine constituent ingredients
The generator SHALL build the compound meal ingredient base from both constituent dishes for portion calculation and shopping lists.

#### Scenario: Constituent ingredients share normalized name
- **WHEN** both constituent dishes include ingredients with the same `normalized_name` and compatible unit
- **THEN** the generator SHALL sum their quantities in the compound ingredient base

### Requirement: Simple meal generation MUST remain unchanged
Meals without `compound_day_id` SHALL continue using the existing simple meal generation behavior.

#### Scenario: Source meal is not compound
- **WHEN** a source meal has no `compound_day_id`
- **THEN** the generator SHALL process it as a single dish as before

### Requirement: Compound meals MUST appear in the meal library
Compound meals SHALL appear in the `mealLibrary` alongside simple meals and remain categorized by `meal_type`.

#### Scenario: Meal library includes compound meal
- **WHEN** the meal library is built from source weekly meals
- **THEN** compound meals SHALL be included under their `desayuno`, `comida`, or `cena` category
