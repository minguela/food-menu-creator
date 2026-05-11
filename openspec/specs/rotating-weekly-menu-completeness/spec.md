## Purpose
Ensure rotating menu generation preserves complete source weekly menu blocks and reports missing expected meals before persistence.

## Requirements

### Requirement: Rotating generation MUST use complete weekly menu blocks
The system SHALL generate rotating menus by assigning each 7-day block to exactly one source weekly menu.

#### Scenario: Selected initial weekly menu fills first block
- **WHEN** the user selects weekly menu D as the initial menu and generates a rotating menu for at least 7 days
- **THEN** rotating days 1 through 7 SHALL map to source days 1 through 7 from weekly menu D only

#### Scenario: No initial menu uses random first block
- **WHEN** the user generates a rotating menu without selecting an initial weekly menu
- **THEN** the first 7-day block SHALL use one randomly selected weekly menu as a complete block

#### Scenario: Remaining menus are random without repetition
- **WHEN** a rotating menu requires multiple weekly blocks
- **THEN** the generator SHALL randomize remaining weekly menus and SHALL NOT repeat a weekly menu until all selected weekly menus have been used once

#### Scenario: Rotation continues after all menus are exhausted
- **WHEN** the requested duration requires more weekly blocks than selected weekly menus
- **THEN** the generator SHALL start another cycle only after all selected weekly menus have been used in the current cycle

### Requirement: Source day meals MUST remain complete
The system SHALL preserve every valid meal from each source weekly menu day in the corresponding rotating day.

#### Scenario: Lunch and dinner stay together
- **WHEN** source day 3 of weekly menu B has comida and cena meals
- **THEN** the generated rotating day mapped to that source day SHALL contain those comida and cena meals together without mixing with another weekly menu or source day

#### Scenario: Multiple dishes in same meal type are preserved
- **WHEN** a source day has two comida dishes with `meal_slot` 1 and 2
- **THEN** the generated rotating day SHALL contain both comida dishes with their original slots

#### Scenario: Breakfast remains fixed but source day still controls other meals
- **WHEN** breakfast is present on every source day and comida/cena vary by weekly menu
- **THEN** breakfast SHALL be preserved and comida/cena SHALL still come from the same source weekly menu day

### Requirement: Rotating meals MUST support meal slots
The system SHALL persist and expose `meal_slot` for rotating menu meals.

#### Scenario: Saving multiple dishes for same meal type
- **WHEN** a generated day contains two normal comida dishes from the same source day
- **THEN** both dishes SHALL be saved in `rotating_menu_meals` with distinct `meal_slot` values

#### Scenario: Loading detail preserves slot order
- **WHEN** a rotating menu detail is loaded
- **THEN** meals SHALL be ordered by meal type and `meal_slot` so all dishes are visible in the expected order

### Requirement: Incomplete generated source days MUST be blocked
The system SHALL fail generation before persistence when generated meals do not match the expected source weekly menu day structure.

#### Scenario: Recipe validation removes an expected dish
- **WHEN** a source day contains comida slot 1 and comida slot 2 but one of them is discarded during recipe validation
- **THEN** the generator SHALL fail with a diagnostic identifying weekly menu, source day, meal type, slot and dish name

#### Scenario: Missing dinner is not backfilled
- **WHEN** a mapped source day is missing cena after validation
- **THEN** the generator SHALL fail and SHALL NOT replace cena with a meal from another source day or weekly menu

#### Scenario: Supabase source menus are the comparison source
- **WHEN** generation validates completeness
- **THEN** it SHALL compare generated meals against the selected `weekly_meals` rows from Supabase after applying recipe-validity filtering rules
