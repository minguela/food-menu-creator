## ADDED Requirements

### Requirement: Ingredients screen MUST support CSV import via modal
The system MUST provide a modal-based CSV import flow in the ingredients screen.

#### Scenario: Open import modal and submit CSV
- **WHEN** user clicks import CSV button and submits valid CSV content
- **THEN** system imports rows and refreshes ingredient list

### Requirement: Ingredients screen MUST support CSV export on demand
The system MUST allow exporting current ingredients table to CSV from the UI.

#### Scenario: Export ingredients CSV
- **WHEN** user clicks export CSV
- **THEN** browser downloads a CSV file with ingredient nutrition fields

### Requirement: Ingredient model MUST include english name
The system MUST store an optional `english_name` for each ingredient.

#### Scenario: Save ingredient with english name
- **WHEN** user edits and saves an ingredient with english name
- **THEN** english name is persisted and available for future workflows

### Requirement: Selected ingredient merge MUST require explicit destination
The system MUST let users merge selected ingredients into a destination ingredient and preserve recipe relationships.

#### Scenario: Merge selected ingredients into destination
- **WHEN** user selects multiple ingredients and confirms destination ingredient
- **THEN** related `recipe_ingredients` are reassigned to destination and source ingredients are removed

### Requirement: Manual-first UI MUST remove automatic curation controls
The system MUST hide source visibility and automatic enrichment controls from ingredient cards and filters.

#### Scenario: Open ingredient card in manual-first mode
- **WHEN** user views ingredient card
- **THEN** card does not show source selector nor OFF/autocomplete/restore actions
