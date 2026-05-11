## ADDED Requirements

### Requirement: Recipes view MUST show blocking ingredients
The recipes curation view SHALL identify and display ingredient rows that block recipe completeness.

#### Scenario: Missing ingredient link
- **WHEN** a confirmed row has no `ingredient_id`
- **THEN** the UI SHALL mark it as blocking and list it in a diagnostics section

#### Scenario: Missing nutrition
- **WHEN** a linked ingredient has incomplete nutrition status
- **THEN** the UI SHALL mark it as blocking and provide guidance to resolve it

### Requirement: Blocking summary MUST be visible before generation
Users SHALL be able to see a per-recipe blocker count from recipe cards/listing.

#### Scenario: Recipe has blockers
- **WHEN** a recipe contains one or more blocking ingredients
- **THEN** the card/list entry SHALL display a visible blocker indicator with count
