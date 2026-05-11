## ADDED Requirements

### Requirement: Manual CSV import MUST be the primary curation path
The system MUST treat manual CSV import as the primary enrichment source and assign `source=manual_csv` on imported rows.

#### Scenario: Import manual CSV row
- **WHEN** a valid CSV row is processed
- **THEN** ingredient source is set to `manual_csv`

### Requirement: Import status MUST follow automatic quality checks
The system MUST set `nutrition_status=complete` only when the imported row passes automatic nutrition consistency checks; otherwise it MUST set `needs_review`.

#### Scenario: CSV row passes quality gate
- **WHEN** kcal/protein/carbs/fat are complete and consistent
- **THEN** row is stored as `complete` and `is_verified=true`

#### Scenario: CSV row fails quality gate
- **WHEN** imported values are incomplete or inconsistent
- **THEN** row is stored as `needs_review` with a review reason

### Requirement: Ingredient candidate debug MUST be visible
The system MUST allow users to inspect the raw payload of OFF/USDA candidates for each ingredient.

#### Scenario: Open candidate debug
- **WHEN** user clicks debug on a candidate
- **THEN** UI shows the candidate raw payload in readable JSON

### Requirement: Ingredients MUST be classified by caloric density
The system MUST store a caloric density level based on kcal per 100g.

#### Scenario: Classify ingredient by kcal per 100g
- **WHEN** kcal per 100g is available
- **THEN** ingredient is tagged as `very_low`, `low`, `normal`, `caloric`, or `very_caloric`

### Requirement: Rotating menu scaling MUST guard high-caloric recipes
The system MUST cap recipe serving multipliers when recipes include caloric or very caloric ingredients.

#### Scenario: Recipe contains very caloric ingredients
- **WHEN** generating rotating portions
- **THEN** serving multiplier is capped at a stricter maximum than standard recipes
