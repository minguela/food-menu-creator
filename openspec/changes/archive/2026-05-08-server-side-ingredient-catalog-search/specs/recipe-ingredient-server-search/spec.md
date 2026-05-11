## ADDED Requirements

### Requirement: Search ingredient catalog from server during recipe curation
The system MUST provide a server-side endpoint to search existing ingredients by user query during recipe curation.

#### Scenario: Query with valid text
- **WHEN** the user types at least 2 characters in the catalog search input
- **THEN** the frontend requests the server endpoint and receives a bounded list of matching ingredients

### Requirement: Keep draft-first add flow with server results
The system MUST keep creating local draft rows when adding a searched ingredient and MUST persist only on explicit save.

#### Scenario: Add searched ingredient result
- **WHEN** the user selects a server-returned catalog ingredient and clicks add
- **THEN** the UI creates a confirmed draft row linked by `ingredient_id` without immediate DB insert

### Requirement: Preserve duplicate prevention in open recipe
The system MUST prevent adding a catalog ingredient whose normalized identity already exists in the open recipe.

#### Scenario: Attempt to add duplicate normalized ingredient
- **WHEN** a selected server result normalizes to a value already present in recipe rows
- **THEN** the system blocks the add and shows an actionable validation message
