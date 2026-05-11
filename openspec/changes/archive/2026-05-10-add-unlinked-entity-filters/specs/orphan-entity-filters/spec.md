## ADDED Requirements

### Requirement: Filter recipes without ingredients
The system MUST provide a filter control in the recipes page that shows only recipes with no associated ingredients.

#### Scenario: Toggle orphan-recipe filter on
- **WHEN** the user activates the "sin ingredientes" filter in recipes
- **THEN** the list SHALL include only recipes whose ingredient count is zero

#### Scenario: Toggle orphan-recipe filter off
- **WHEN** the user deactivates the "sin ingredientes" filter in recipes
- **THEN** the list SHALL return to the normal filtered dataset

### Requirement: Filter ingredients without recipes
The system MUST provide a filter control in the ingredients page that shows only ingredients that are not linked to any recipe.

#### Scenario: Toggle orphan-ingredient filter on
- **WHEN** the user activates the "sin recetas" filter in ingredients
- **THEN** the list SHALL include only ingredients with zero recipe links

#### Scenario: Toggle orphan-ingredient filter off
- **WHEN** the user deactivates the "sin recetas" filter in ingredients
- **THEN** the list SHALL return to the normal filtered dataset

### Requirement: Contextual empty state for orphan filters
The system MUST display contextual empty-state messaging when an orphan filter is active and no matching results exist.

#### Scenario: No orphan recipes found
- **WHEN** the orphan-recipe filter is active and there are no matching recipes
- **THEN** the UI SHALL display a message indicating that no recipes without ingredients were found

#### Scenario: No orphan ingredients found
- **WHEN** the orphan-ingredient filter is active and there are no matching ingredients
- **THEN** the UI SHALL display a message indicating that no ingredients without recipes were found
