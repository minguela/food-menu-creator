## Purpose
Ensure rotating menu portion calculation never collapses to symbolic gram quantities and can treat placeholder recipe quantities as relative weights.

## Requirements

### Requirement: Recipe base quantities MUST be preserved as minimum quantities
The rotating menu generator SHALL treat confirmed recipe ingredient quantities as the fixed/base portion for a normal meal and SHALL NOT generate a profile ingredient quantity below that base quantity.

#### Scenario: Lower-kcal profile uses a normal meal
- **WHEN** a normal meal has a confirmed recipe ingredient with `base_quantity = 100 g`
- **THEN** every generated profile portion for that meal SHALL have `final_quantity >= 100 g`

### Requirement: Placeholder recipe bases MUST scale as relative quantities
The system SHALL treat complete normal recipes with placeholder-sized positive quantities as relative ingredient weights, not as hard blockers, and SHALL scale them to meaningful profile portions.

#### Scenario: Ingredient quantities are placeholder grams
- **WHEN** a recipe contains confirmed gram-convertible ingredients that normalize to about `1 g` each
- **THEN** generation SHALL mark the recipe as using relative quantities and SHALL allow multipliers above the old `x2.50` cap to reach target nutrition

### Requirement: Portion scaling MUST fit profile targets or warn clearly
The generator SHALL calculate profile portions from target kcal/protein and validated recipe bases, and SHALL surface warning diagnostics when selected meals cannot produce acceptable day totals.

#### Scenario: Scaling misses target tolerance
- **WHEN** calculated daily kcal or protein totals are below configured tolerance
- **THEN** generation SHALL return the menu and include warning diagnostics instead of hiding the generated result

### Requirement: Calculation diagnostics MUST expose scaling inputs and outputs
The generator SHALL log or return enough diagnostics to explain kcal and quantity scaling decisions for each failed or warning meal/profile.

#### Scenario: Target-fit validation warns
- **WHEN** generation warns because calculated nutrition is outside tolerance
- **THEN** diagnostics SHALL include profile, day, meal type, slot, dish name, targets, totals and final ingredient quantities
