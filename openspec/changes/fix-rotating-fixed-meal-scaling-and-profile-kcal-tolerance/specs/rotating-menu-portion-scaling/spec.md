## MODIFIED Requirements

### Requirement: Recipe base quantities MUST be preserved as minimum quantities
The rotating menu generator SHALL treat confirmed ingredient quantities as the fixed/base portion for a normal meal and SHALL NOT generate a profile ingredient quantity below that base quantity, regardless of whether the base comes from curated recipe ingredients or `weekly_meal_ingredients` defined directly on the source weekly meal.

#### Scenario: Lower-kcal profile uses a normal meal
- **WHEN** a normal meal has a confirmed ingredient with `base_quantity = 100 g`
- **THEN** every generated profile portion for that meal SHALL have `final_quantity >= 100 g`

#### Scenario: Weekly fixed meal uses weekly ingredient rows
- **WHEN** a source weekly breakfast/comida/cena has explicit `weekly_meal_ingredients` and no reusable `dish` recipe ingredients are available
- **THEN** the generator SHALL use those weekly ingredient quantities as the scaling base instead of leaving the meal unscaled or treating it as ingredient-less

### Requirement: Portion scaling MUST fit profile targets or warn clearly
The generator SHALL calculate profile portions from validated meal bases and SHALL evaluate day-level kcal compliance against the selected profile's configured tolerance.

#### Scenario: Same generated day passes for relaxed profile but warns for strict profile
- **WHEN** two selected profiles share the same generated day totals but one profile has a wider kcal tolerance than the other
- **THEN** warning/compliance evaluation SHALL use each profile's own kcal lower bound rather than one global hardcoded ratio

#### Scenario: Weekly fixed meal scales above base quantities
- **WHEN** a weekly fixed meal has explicit base ingredients and the selected profile requires more kcal than the base meal provides
- **THEN** the generator SHALL increase those ingredient quantities through the normal scaling path while keeping every final quantity at or above its weekly base quantity

### Requirement: Calculation diagnostics MUST expose scaling inputs and outputs
The generator SHALL log or return enough diagnostics to explain kcal and quantity scaling decisions for each failed or warning meal/profile, including when the ingredient base came from `weekly_meal_ingredients`.

#### Scenario: Weekly fixed meal nutrition cannot be resolved
- **WHEN** a weekly fixed meal ingredient cannot be matched to complete catalog nutrition
- **THEN** diagnostics SHALL identify the source weekly meal, ingredient name, quantity, unit, and unresolved nutrition state
