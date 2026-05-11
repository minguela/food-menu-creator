## ADDED Requirements

### Requirement: App MUST show toast feedback for key actions
The system MUST display in-app toast notifications for save, delete, import, export, and merge actions.

#### Scenario: Successful operation
- **WHEN** a user action completes successfully
- **THEN** a success toast is shown with contextual message

#### Scenario: Failed operation
- **WHEN** a user action fails
- **THEN** an error toast is shown and the error is logged

### Requirement: Action modals MUST close only after successful completion
The system MUST close action modals only when the underlying operation succeeds.

#### Scenario: CSV import success
- **WHEN** CSV import completes without error
- **THEN** the import modal closes and success toast is shown

#### Scenario: CSV import failure
- **WHEN** CSV import fails
- **THEN** the import modal remains open and error toast is shown
