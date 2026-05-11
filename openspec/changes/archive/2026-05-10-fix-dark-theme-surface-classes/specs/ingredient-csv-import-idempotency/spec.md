## ADDED Requirements

### Requirement: CSV import MUST be idempotent for duplicate ingredients
The ingredient CSV import endpoint MUST handle duplicate ingredient keys (existing in DB or repeated in the same file) without returning a 500 server error.

#### Scenario: Duplicate ingredient already exists in database
- **WHEN** a CSV row resolves to an ingredient key that already exists
- **THEN** the import MUST update or skip that row deterministically according to import policy and continue processing remaining rows

#### Scenario: Duplicate rows inside the same CSV file
- **WHEN** multiple CSV rows resolve to the same ingredient identity
- **THEN** the endpoint MUST deduplicate or merge them deterministically and MUST NOT fail with a unique constraint exception

### Requirement: CSV import MUST return actionable result summary
The CSV import endpoint MUST return a structured summary describing row outcomes so operators can understand what was applied.

#### Scenario: Mixed import outcomes
- **WHEN** a CSV contains rows that are inserted, updated, skipped, or conflict-resolved
- **THEN** the API response MUST include counts (at least inserted/updated/skipped) and MAY include row-level diagnostics for conflicts

#### Scenario: Unrecoverable parsing/validation error
- **WHEN** the CSV payload is invalid and cannot be processed
- **THEN** the endpoint MUST return a clear 4xx error with actionable message instead of an opaque 500 unique-constraint failure

### Requirement: Import UI MUST expose summary to the user
The ingredients UI MUST display the import result summary after CSV upload, including whether duplicates were merged/updated/skipped.

#### Scenario: Import completes with duplicate handling
- **WHEN** the backend returns a successful import summary with non-zero skipped/updated rows
- **THEN** the UI MUST show a success/info message that includes those counts so the user can verify outcome
