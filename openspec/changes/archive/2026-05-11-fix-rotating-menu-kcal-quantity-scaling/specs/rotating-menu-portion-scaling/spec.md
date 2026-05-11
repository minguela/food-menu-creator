## ADDED Requirements

### Requirement: Recipe base quantities MUST be preserved as minimum quantities
The rotating menu generator SHALL treat confirmed recipe ingredient quantities as the fixed/base portion for a normal meal and SHALL NOT generate a profile ingredient quantity below that base quantity.

#### Scenario: Lower-kcal profile uses a normal meal
- **WHEN** a normal meal has a confirmed recipe ingredient with `base_quantity = 100 g`
- **THEN** every generated profile portion for that meal SHALL have `final_quantity >= 100 g`

#### Scenario: Fixed breakfast is generated
- **WHEN** a fixed/base breakfast recipe is included in a rotating day
- **THEN** its ingredient quantities SHALL remain at least the curated recipe quantities before any profile-specific increase is applied

### Requirement: Placeholder recipe bases MUST scale as relative quantities
The system SHALL treat complete normal recipes with placeholder-sized positive quantities as relative ingredient weights, not as hard blockers, and SHALL scale them to meaningful profile portions.

#### Scenario: Ingredient quantities are placeholder grams
- **WHEN** a recipe contains confirmed gram-convertible ingredients that normalize to about `1 g` each
- **THEN** generation SHALL mark the recipe as using relative quantities and SHALL allow multipliers above the old `x2.50` cap to reach target nutrition

#### Scenario: Dish base kcal is too low for a normal meal
- **WHEN** a complete non-special dish has a calculated `base_kcal` below the configured minimum normal-dish threshold
- **THEN** generation SHALL keep the dish eligible as a relative-quantity recipe and SHALL expose diagnostics for curation follow-up

### Requirement: Portion scaling MUST fit profile targets or fail loudly
The generator SHALL calculate profile portions from target kcal/protein and validated recipe bases, and SHALL fail before persistence when selected meals cannot produce acceptable day totals.

#### Scenario: Base recipes can satisfy target day
- **WHEN** a generated day has valid normal meals and profile targets of 1900 kcal and 1400 kcal
- **THEN** generated daily kcal totals SHALL be within the configured acceptable tolerance for each profile

#### Scenario: Scaling cap prevents target fit
- **WHEN** density or max-serving constraints prevent a generated day from reaching the acceptable target tolerance
- **THEN** generation SHALL fail with diagnostics including target kcal, calculated kcal, base kcal, desired multiplier and applied multiplier

### Requirement: Daily nutrition guardrails MUST run before persistence
The system SHALL validate every generated day/profile total before inserting rotating menus, days, meals, portions or ingredients.

#### Scenario: Day total is far below target
- **WHEN** a non-free generated day totals 54 kcal for a 1900 kcal profile target
- **THEN** the generator SHALL reject the result and SHALL NOT persist the rotating menu

#### Scenario: Day includes explicitly reserved free/special kcal
- **WHEN** a day has special/free meals with reserved kcal
- **THEN** the guardrail SHALL subtract only explicitly reserved kcal from the regular meal target before validating regular meal totals

### Requirement: Calculation diagnostics MUST expose scaling inputs and outputs
The generator SHALL log or return enough diagnostics to explain kcal and quantity scaling decisions for each failed meal/profile.

#### Scenario: Target-fit validation fails
- **WHEN** generation fails because calculated nutrition is outside tolerance
- **THEN** diagnostics SHALL include profile, day, meal type, slot, dish name, base kcal, base protein, target meal kcal, target meal protein, desired multiplier, applied multiplier, final kcal and final ingredient quantities

### Requirement: Regression tests MUST cover collapsed kcal and gram quantities
The backend test suite SHALL include deterministic coverage that prevents recurrence of tiny ingredient quantities and extremely low daily kcal totals.

#### Scenario: Reported collapsed menu pattern is tested
- **WHEN** test fixtures include meals equivalent to jamon con tomate, gazpacho, pollo with patata/boniato, salad and fish with rice
- **THEN** the test SHALL assert generation either reaches acceptable profile totals or fails with explicit implausible-recipe diagnostics, never persisting a 54 kcal day
