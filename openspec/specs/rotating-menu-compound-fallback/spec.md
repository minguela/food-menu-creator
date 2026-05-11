## Purpose
Resolve legacy compound weekly meals that contain `+` in `dish_name` but do not have `compound_day_id` populated.

## Requirements

### Requirement: Generator MUST detect name-based compound candidates
The rotating menu generator SHALL treat a source meal as a compound candidate when full-name dish lookup fails and `dish_name` contains `+`.

#### Scenario: Compound name without compound_day_id
- **WHEN** a source meal has `dish_name` like `Pescado blanco + ensalada` and no matching full-name dish exists
- **THEN** the generator SHALL attempt name-based compound resolution

### Requirement: Generator MUST resolve all compound name parts
The generator SHALL split compound candidate names by `/\s*\+\s*/`, normalize each part, and look up every part in `dishByNormalizedName`.

#### Scenario: All parts exist
- **WHEN** every normalized compound name part matches an existing dish
- **THEN** the generator SHALL construct a virtual compound dish from all matched parts

#### Scenario: Any part is missing
- **WHEN** one or more normalized compound name parts do not match an existing dish
- **THEN** the generator SHALL discard the meal with `recipe_name_not_found`

### Requirement: Virtual compound dishes MUST support multiple parts
The name-based fallback SHALL support two or more constituent dishes and combine their recipe, nutrition, and ingredient data.

#### Scenario: Three-part compound meal
- **WHEN** a source meal contains three dishes joined by `+` and all parts have valid recipes
- **THEN** the generated virtual dish SHALL include all three constituent recipes in validation and ingredient calculation

### Requirement: Structured compound resolution MUST remain preferred
The generator SHALL use existing `compound_day_id` resolution before attempting name-based fallback.

#### Scenario: compound_day_id is available
- **WHEN** a source meal has a valid `compound_day_id`
- **THEN** the generator SHALL resolve it through `compound_day_meals` and SHALL NOT rely on name splitting
