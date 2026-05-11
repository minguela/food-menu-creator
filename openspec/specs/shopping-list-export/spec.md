## Purpose
Allow users to export generated shopping lists in reusable text and CSV formats from the web UI and Telegram.

## Requirements

### Requirement: User can export shopping list as text
The system SHALL provide a text format export of the current shopping list containing ingredient names, quantities, and units.

#### Scenario: Successful text export
- **WHEN** user requests text export via web UI or Telegram
- **THEN** system returns plain text with one ingredient per line in format "quantity unit ingredient"

#### Scenario: Empty shopping list export
- **WHEN** user requests export with no items
- **THEN** system returns message "Shopping list is empty"

### Requirement: User can export shopping list as CSV
The system SHALL provide a CSV format export with headers: ingredient,quantity,unit,category.

#### Scenario: Successful CSV export
- **WHEN** user requests CSV export via web UI
- **THEN** system returns CSV file with proper headers and all shopping list items

#### Scenario: CSV handles special characters
- **WHEN** ingredient name contains commas or quotes
- **THEN** system properly escapes them in CSV output

### Requirement: Telegram export command
The Telegram bot SHALL support `/shopping export [format]` command where format is "text" or "csv".

#### Scenario: Telegram text export
- **WHEN** user sends `/shopping export text`
- **THEN** bot responds with formatted text of shopping list

#### Scenario: Telegram CSV export
- **WHEN** user sends `/shopping export csv`
- **THEN** bot sends CSV file attachment
