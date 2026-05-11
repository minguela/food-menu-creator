## ADDED Requirements

### Requirement: Rotating validation MUST allow naturally zero-carb meals
The rotating generator SHALL accept non-special meals where one macro is zero, as long as meal kcal is positive, ingredient list is non-empty, and total macro mass is positive.

#### Scenario: Fish-only meal with zero carbs
- **WHEN** a generated non-special meal has `carbs = 0`, `protein > 0`, `kcal > 0`, and ingredients present
- **THEN** the meal SHALL NOT be rejected as invalid

### Requirement: Rotating validation MUST reject truly invalid meal portions
The generator SHALL reject non-special meal portions that are structurally or nutritionally invalid.

#### Scenario: Empty or zero-mass portion
- **WHEN** a portion has no ingredients, or kcal `<= 0`, or all macros sum to `<= 0`, or nutrition is pending
- **THEN** generation SHALL fail with 422 and include the invalid meal diagnostics
