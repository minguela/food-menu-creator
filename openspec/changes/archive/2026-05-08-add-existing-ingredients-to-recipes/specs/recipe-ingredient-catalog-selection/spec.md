## ADDED Requirements

### Requirement: Add existing catalog ingredients during recipe curation
The system MUST allow users to add ingredients from the existing `ingredients` catalog while editing a recipe, and MUST create a local draft row before persistence.

#### Scenario: Add existing ingredient from catalog
- **WHEN** the user selects an existing ingredient from the catalog picker in recipe curation
- **THEN** the UI creates a confirmed draft row with `ingredient_id`, canonical `name`, and normalized value, without immediate DB insert

### Requirement: Persist draft rows only on explicit save
The system MUST persist draft recipe ingredient rows only when the user performs an explicit save action (row save or form save).

#### Scenario: Save form persists draft rows
- **WHEN** the user clicks save in the recipe editor and there are draft ingredient rows
- **THEN** the system inserts/updates those rows in `recipe_ingredients` and replaces draft identifiers with persisted row identifiers

### Requirement: Prevent duplicate recipe ingredients by normalized identity
The system MUST prevent duplicate ingredients within the same recipe based on normalized name identity.

#### Scenario: Duplicate normalized ingredient in same recipe
- **WHEN** a user tries to add an ingredient whose normalized name already exists in the current recipe
- **THEN** the system blocks duplicate creation in UI and the backend enforces a single canonical row for that normalized value

### Requirement: Canonicalize recipe ingredient naming from catalog
When a recipe ingredient is linked to a catalog ingredient (`ingredient_id` present), the system MUST persist the canonical catalog name and its normalized value.

#### Scenario: Save linked ingredient with non-canonical user text
- **WHEN** a linked row is saved with a user-edited name variant
- **THEN** the stored row uses the canonical `ingredients.name` and corresponding normalized value

### Requirement: Keep recipe status pending while suggestions remain
The system MUST NOT set recipe status to `complete` while any suggested or unconfirmed ingredient exists for that recipe.

#### Scenario: Confirmed rows exist but suggestions remain
- **WHEN** at least one confirmed ingredient exists and at least one suggested/unconfirmed row remains
- **THEN** recipe status is set to `pending_ingredients` and not `complete`
