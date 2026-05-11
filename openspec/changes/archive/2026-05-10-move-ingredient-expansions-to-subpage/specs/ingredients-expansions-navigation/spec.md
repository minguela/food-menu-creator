## ADDED Requirements

### Requirement: Expansions management MUST have a dedicated ingredients subpage
Users SHALL manage ingredient expansion rules from a full page under the ingredients area.

#### Scenario: Open expansions area
- **WHEN** a user is on `/ingredients` and opens expansions
- **THEN** the application SHALL navigate to `/ingredients/expansions` and show the full expansions list

### Requirement: Ingredients page MUST stay focused on ingredient curation
The ingredients master list page SHALL not embed the full expansions CRUD block.

#### Scenario: Ingredients page content
- **WHEN** a user opens `/ingredients`
- **THEN** the page SHALL provide a link to expansions instead of inline expansion cards and modal
