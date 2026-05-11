## Purpose
Allow users to inspect generated rotating menus even when kcal/protein targets are not reached, while preserving warning diagnostics.

## Requirements

### Requirement: Nutrition tolerance misses MUST be non-blocking warnings
The rotating menu generator SHALL persist and return generated menus when daily kcal/protein totals are calculable but outside tolerance.

#### Scenario: Day totals are below tolerance
- **WHEN** generated day/profile totals are below kcal or protein tolerance but meals have valid ingredients and positive macros
- **THEN** the generator SHALL return success and include `warnings.day_nutrition_violations`

#### Scenario: Meal data is structurally invalid
- **WHEN** a normal meal has no ingredients, non-positive kcal, negative macros, zero macro mass or pending nutrition
- **THEN** the generator SHALL fail before persistence as before

### Requirement: Nutrition warnings MUST be observable
Nutrition tolerance misses SHALL be logged as warnings with profile/day/meal diagnostics instead of failed generation events.

#### Scenario: Warning is logged
- **WHEN** tolerance violations exist
- **THEN** logs SHALL use warning severity and completed macro validation status
