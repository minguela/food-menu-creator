## MODIFIED Requirements

### Requirement: Nutrition tolerance misses MUST be non-blocking warnings
The rotating menu generator SHALL persist and return generated menus when daily kcal/protein totals are calculable but outside tolerance, and day-level kcal tolerance SHALL be evaluated from the selected profile's configured tolerance instead of a single global hardcoded ratio.

#### Scenario: Day totals are below profile kcal tolerance
- **WHEN** generated day/profile totals are below that profile's acceptable kcal lower bound but meals have valid ingredients and positive macros
- **THEN** the generator SHALL return success and include `warnings.day_nutrition_violations`

#### Scenario: Day totals are inside profile kcal tolerance
- **WHEN** generated day/profile totals are at or above the selected profile's kcal lower bound
- **THEN** the generator SHALL NOT emit a kcal warning for that profile even if the total would have failed an older stricter global ratio

### Requirement: Nutrition warnings MUST be observable
Nutrition tolerance misses SHALL be logged as warnings with profile/day/meal diagnostics instead of failed generation events, and the diagnostics SHALL include the tolerance inputs used for the warning decision.

#### Scenario: Warning is logged with tolerance metadata
- **WHEN** tolerance violations exist
- **THEN** logs and API diagnostics SHALL include the selected profile, target kcal, calculated kcal, tolerance percent, and the effective lower kcal bound used for comparison
