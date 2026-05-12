## ADDED Requirements

### Requirement: Ingredient scaling MUST account for caloric density
The rotating menu generator SHALL scale ingredient quantities with density-aware factors instead of applying the same multiplier to every ingredient.

#### Scenario: Very caloric and low-density ingredients share a meal
- **WHEN** a meal contains a `very_caloric` ingredient and a low-density ingredient and the meal multiplier is greater than `1`
- **THEN** the low-density ingredient SHALL receive a larger quantity multiplier than the very caloric ingredient

### Requirement: Base ingredient quantities MUST remain minimums
Density-aware scaling SHALL NOT reduce a normal ingredient below its curated/base quantity.

#### Scenario: Density factor is below one
- **WHEN** a very caloric ingredient uses a density factor below `1`
- **THEN** its final quantity SHALL still be at least its base quantity

### Requirement: Density fallback MUST use kcal per 100g
When `caloric_density_level` is missing, the generator SHALL infer a density bucket from `kcal_per_100g`.

#### Scenario: Missing density level with high kcal
- **WHEN** an ingredient has no `caloric_density_level` and `kcal_per_100g > 400`
- **THEN** the generator SHALL treat it as very caloric for scaling purposes

### Requirement: Nutrition totals MUST use final density-scaled quantities
The generator SHALL calculate profile kcal and macros from final ingredient quantities after density-aware scaling.

#### Scenario: Ingredients scale unevenly
- **WHEN** density-aware scaling produces different per-ingredient quantity multipliers
- **THEN** final kcal/protein/carbs/fat SHALL be calculated from those final quantities, not from the global meal multiplier alone
